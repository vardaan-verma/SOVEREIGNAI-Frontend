FROM python:3.10-slim

LABEL maintainer="MRPL AI Team"
LABEL description="Sandbox image for execute_python and execute_bash tools"

WORKDIR /sandbox

# Install scientific packages — NO network during runtime
RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    pandas==2.2.2 \
    scipy==1.13.1 \
    matplotlib==3.9.2 \
    openpyxl==3.1.5

# Create restricted user with no sudo
RUN useradd -m -s /bin/bash sandbox_user && \
    chown -R sandbox_user:sandbox_user /sandbox

# No write access to system directories
RUN chmod 755 /

USER sandbox_user

ENTRYPOINT ["python"]
