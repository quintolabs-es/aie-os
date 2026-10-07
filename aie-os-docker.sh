#!/usr/bin/env bash
# Runs AIE OS inside a Docker container, for machines that have Docker but not Node.
# It runs the same pinned command as the npx option, `npx --yes github:quintolabs-es/aie-os#<version>`,
# in the official node:24 image, with the current directory mounted at the same path.
#
# Run it from the target project directory:
#   curl -fsSL https://raw.githubusercontent.com/quintolabs-es/aie-os/v0.2.1/aie-os-docker.sh | bash -s <init|build> [options]

set -euo pipefail

aie_os_version="v0.2.1"
node_image="node:24"

main() {
  if ! command -v docker >/dev/null 2>&1; then
    fail "Docker is required. Install Docker, or run AIE OS with npx instead."
  fi

  if ! docker info >/dev/null; then
    fail "Docker is not running or not accessible. Fix the docker error above and try again."
  fi

  local project_path
  project_path="$(pwd -P)"

  case "$project_path" in
    *,* | *\"*) fail "The project path cannot contain ',' or '\"' when running with Docker. Run AIE OS with npx instead." ;;
  esac

  local docker_args=(
    run --rm --init
    --mount "type=bind,source=$project_path,target=$project_path"
    --workdir "$project_path"
    --security-opt label=disable
    --env NO_COLOR
  )

  if [ "$(uname -s)" = "Linux" ] && ! engine_maps_root_to_caller; then
    docker_args+=(--user "$(id -u):$(id -g)" --env HOME=/tmp)
  fi

  local npx_command=(npx --yes "github:quintolabs-es/aie-os#$aie_os_version" "$@")

  if terminal_attached; then
    docker "${docker_args[@]}" --interactive --tty "$node_image" "${npx_command[@]}" </dev/tty
  else
    docker "${docker_args[@]}" "$node_image" "${npx_command[@]}"
  fi
}

# Rootless Docker, rootless Podman, and Docker Desktop for Linux map container root to the calling user,
# so running as root already creates files the caller owns.
engine_maps_root_to_caller() {
  case "$(docker info --format '{{.SecurityOptions}}' 2>/dev/null)" in
    *rootless*) return 0 ;;
  esac

  if [ "$(docker info --format '{{.Host.Security.Rootless}}' 2>/dev/null)" = "true" ]; then
    return 0
  fi

  if [ "$(docker info --format '{{.OperatingSystem}}' 2>/dev/null)" = "Docker Desktop" ]; then
    case "$(cat /proc/version 2>/dev/null)" in
      *[Mm]icrosoft*) return 1 ;;
    esac
    return 0
  fi

  return 1
}

# With `curl ... | bash`, stdin is the script itself, so prompts read from the terminal device instead.
terminal_attached() {
  [ -t 1 ] && { : </dev/tty; } 2>/dev/null
}

fail() {
  printf 'aie-os-docker: %s\n' "$1" >&2
  exit 1
}

main "$@"
