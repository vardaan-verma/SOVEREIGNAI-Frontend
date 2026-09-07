"""
knowledge_base.py — kb_search tool using pgvector + local sentence-transformers.

Searches an internal PostgreSQL/pgvector database containing SOPs,
correspondence, maintenance logs, and specifications.

If PostgreSQL is not available, returns a structured error so the server
stays up and all other tools continue to work.
"""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

from mcp_server import config


class KnowledgeBaseTool:
    """Semantic search over the local pgvector knowledge base."""

    def __init__(self) -> None:
        self._conn = None
        self._embedding_model = None
        self._init_error: Optional[str] = None
        self._try_connect()

    # ── Initialization ────────────────────────────────────────────────────

    def _try_connect(self) -> None:
        """Attempt to connect to PostgreSQL. Store error if unavailable."""
        try:
            import psycopg2  # type: ignore
            from pgvector.psycopg2 import register_vector  # type: ignore

            self._conn = psycopg2.connect(config.KB_DSN)
            register_vector(self._conn)
            self._ensure_table()
            self._init_error = None
        except ImportError as exc:
            self._init_error = (
                f"Missing package: {exc}. "
                "Run: pip install psycopg2-binary pgvector"
            )
        except Exception as exc:
            self._init_error = (
                f"Cannot connect to knowledge base at '{config.KB_DSN}': {exc}. "
                "Start PostgreSQL with: docker-compose up -d"
            )

    def _ensure_table(self) -> None:
        """Create the documents table if it doesn't exist yet."""
        cur = self._conn.cursor()
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS {config.KB_TABLE} (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                excerpt     TEXT NOT NULL,
                source      TEXT DEFAULT '',
                embedding   vector(384)
            );
        """)
        self._conn.commit()
        cur.close()

    def _get_embedding(self, text: str) -> List[float]:
        """Generate a 384-dim embedding using local sentence-transformers."""
        if self._embedding_model is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
                self._embedding_model = SentenceTransformer(config.KB_EMBEDDING_MODEL)
            except ImportError:
                raise RuntimeError(
                    "sentence-transformers is not installed. "
                    "Run: pip install sentence-transformers"
                )
        return self._embedding_model.encode(text).tolist()

    # ── Public method ─────────────────────────────────────────────────────

    def search(
        self,
        query: str,
        top_k: int = config.KB_DEFAULT_TOP_K,
        similarity_threshold: float = config.KB_DEFAULT_SIMILARITY,
    ) -> Dict[str, Any]:
        """
        Semantic search the knowledge base.

        Returns:
          results: list of {document_id, title, excerpt, relevance_score, source}
          total_results: int
        """
        start = time.time()

        if self._init_error:
            return {
                "results": [],
                "total_results": 0,
                "error": self._init_error,
                "search_time_ms": 0,
            }

        try:
            query_vec = self._get_embedding(query)
            cur = self._conn.cursor()

            cur.execute(f"""
                SELECT id, title, excerpt, source,
                       1 - (embedding <=> %s::vector) AS similarity
                FROM {config.KB_TABLE}
                WHERE 1 - (embedding <=> %s::vector) >= %s
                ORDER BY similarity DESC
                LIMIT %s;
            """, (query_vec, query_vec, similarity_threshold, top_k))

            rows = cur.fetchall()
            cur.close()

            results = []
            for row in rows:
                results.append({
                    "document_id": row[0],
                    "title": row[1],
                    "excerpt": row[2],
                    "source": row[3],
                    "relevance_score": round(float(row[4]), 4),
                })

            return {
                "results": results,
                "total_results": len(results),
                "search_time_ms": int((time.time() - start) * 1000),
            }

        except Exception as exc:
            # Reconnect for next call
            self._try_connect()
            return {
                "results": [],
                "total_results": 0,
                "error": f"Search failed: {exc}",
                "search_time_ms": int((time.time() - start) * 1000),
            }

    # ── Ingest helper (not a registered MCP tool — for admin use) ─────────

    def ingest_document(
        self,
        doc_id: str,
        title: str,
        excerpt: str,
        source: str = "",
    ) -> bool:
        """Insert or update a document in the knowledge base."""
        if self._init_error or self._conn is None:
            return False
        try:
            embedding = self._get_embedding(f"{title}\n{excerpt}")
            cur = self._conn.cursor()
            cur.execute(f"""
                INSERT INTO {config.KB_TABLE} (id, title, excerpt, source, embedding)
                VALUES (%s, %s, %s, %s, %s::vector)
                ON CONFLICT (id) DO UPDATE
                    SET title=EXCLUDED.title,
                        excerpt=EXCLUDED.excerpt,
                        source=EXCLUDED.source,
                        embedding=EXCLUDED.embedding;
            """, (doc_id, title, excerpt, source, embedding))
            self._conn.commit()
            cur.close()
            return True
        except Exception:
            return False
