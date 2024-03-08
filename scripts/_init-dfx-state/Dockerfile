# Build libfaketime
FROM --platform=linux/amd64 ubuntu:22.04 as build

# https://github.com/wolfcw/libfaketime/releases
ENV LIBFAKETIME_COMMIT=d475b925943ad404c6c728ac868dc73949e7281c

RUN apt-get update && apt-get install -y make gcc git

RUN git clone https://github.com/wolfcw/libfaketime.git && \
  cd libfaketime && \
  git checkout ${LIBFAKETIME_COMMIT} && \
  make

FROM --platform=linux/amd64 ubuntu:22.04 as final
WORKDIR /src
ENV HOME=/root

# Copy libfaketime
COPY --from=build /libfaketime/src/libfaketime.so.1 /usr/local/lib
ENV LD_PRELOAD=/usr/local/lib/libfaketime.so.1

# Common dependencies
RUN apt-get update && apt-get install -y \
  curl jq unzip libunwind-dev

# Install Rust and Cargo
ENV PATH="${HOME}/.cargo/bin:${PATH}"
COPY rust-toolchain.toml ./
RUN curl -fsSL https://sh.rustup.rs | bash -s -- -y --no-modify-path
RUN echo "${PATH}"
RUN rustup show

# Install NodeJS and PNPM
ENV PATH="${HOME}/.fnm:${PATH}"
COPY .node-version ./
RUN curl -fsSL https://fnm.vercel.app/install | bash -s -- --skip-shell --install-dir ${HOME}/.fnm
RUN eval "$(fnm env)" && fnm install && fnm use && corepack enable

# Install DFX
ENV PATH="${HOME}/.local/share/dfx/bin:${PATH}"
COPY dfx.json ./
RUN DFXVM_INIT_YES=1 DFX_VERSION=$(cat dfx.json | jq -r .dfx) sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
RUN dfx extension install nns

# Build backend canister
COPY . .
RUN dfx build --check backend

# Run entrypoint
ENTRYPOINT [ "./scripts/_init-dfx-state/entrypoint.sh" ]
