FROM ubuntu:24.04

RUN apt-get update -qq \
	&& apt-get install -y -qq --no-install-recommends curl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

# TARGETARCH is set by Docker to the build's native platform (arm64 on
# Apple Silicon, amd64 elsewhere) so this runs without QEMU on a Mac.
ARG TARGETARCH
RUN case "$TARGETARCH" in \
			arm64) asset=zhtw-mcp-aarch64-unknown-linux-gnu.tar.gz ;; \
			amd64) asset=zhtw-mcp-x86_64-unknown-linux-gnu.tar.gz ;; \
			*) echo "unsupported TARGETARCH: $TARGETARCH" >&2; exit 1 ;; \
		esac \
	&& base=https://github.com/sysprog21/zhtw-mcp/releases/download/latest \
	&& cd /tmp \
	&& curl -fsSLO "$base/$asset" -O "$base/SHA256SUMS" \
	&& sha256sum --ignore-missing -c SHA256SUMS \
	&& tar -xzf "$asset" zhtw-mcp \
	&& install -m 755 zhtw-mcp /usr/local/bin/zhtw-mcp \
	&& rm -f "$asset" SHA256SUMS zhtw-mcp

ENTRYPOINT ["zhtw-mcp"]
