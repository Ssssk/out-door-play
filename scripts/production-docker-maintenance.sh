#!/usr/bin/env bash
set -euo pipefail

# 生产发布前运行的 Docker/发布目录维护脚本。
# 只处理构建缓存、未使用镜像和旧发布目录；绝不清理 Docker volume 或运行中的容器。

deploy_dir="${1:-${DEPLOY_DIR:-}}"
keep_releases="${KEEP_RELEASES:-3}"
cache_until="${DOCKER_CACHE_UNTIL:-168h}"

if [[ -z "$deploy_dir" || "$deploy_dir" != /* ]]; then
  echo "[maintenance] DEPLOY_DIR 必须是绝对路径" >&2
  exit 2
fi

case "$deploy_dir" in
  /|/opt|/var|/home|/root|/tmp)
    echo "[maintenance] 拒绝使用过宽的 DEPLOY_DIR=$deploy_dir" >&2
    exit 2
    ;;
esac

if ! [[ "$keep_releases" =~ ^[3-9][0-9]*$ ]]; then
  echo "[maintenance] KEEP_RELEASES 必须是不小于 3 的整数" >&2
  exit 2
fi

echo "[maintenance] deploy_dir=$deploy_dir keep_releases=$keep_releases cache_until=$cache_until"
echo '=== BEFORE: df -h / ==='
df -h /
echo '=== BEFORE: docker system df ==='
docker system df

disk_used_pct="$(df -P / | awk 'NR == 2 {gsub("%", "", $5); print $5}')"

# 给当前版本和最近两个可回滚版本增加稳定别名，避免 image prune 删除回滚制品。
# docker image ls 默认按创建时间倒序；按 image ID 去重后保留每个仓库的前三个镜像。
for repository in chumen-api chumen-web; do
  slot=1
  while IFS= read -r image_id; do
    [[ -z "$image_id" ]] && continue
    docker tag "$image_id" "$repository:rollback-$slot"
    slot=$((slot + 1))
    ((slot > 3)) && break
  done < <(docker image ls "$repository" --format '{{.ID}}' | awk '!seen[$0]++')
done

if (( disk_used_pct >= 70 )); then
  echo "=== CLEAN: emergency docker builder prune -af (disk usage ${disk_used_pct}%) ==="
  docker builder prune -af
  echo "=== CLEAN: emergency docker image prune -af (disk usage ${disk_used_pct}%) ==="
  docker image prune -af
else
  echo "=== CLEAN: docker builder prune -af --filter until=$cache_until ==="
  docker builder prune -af --filter "until=$cache_until"
  echo "=== CLEAN: docker image prune -af --filter until=$cache_until ==="
  docker image prune -af --filter "until=$cache_until"
fi

releases_dir="$deploy_dir/releases"
if [[ -L "$releases_dir" ]]; then
  echo "[maintenance] 拒绝清理符号链接目录：$releases_dir" >&2
  exit 2
fi

if [[ -d "$releases_dir" ]]; then
  mapfile -t release_dirs < <(
    find "$releases_dir" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
      | sort -nr \
      | cut -d' ' -f2-
  )
  if (( ${#release_dirs[@]} > keep_releases )); then
    echo "=== CLEAN: old release directories (keep $keep_releases) ==="
    for old_release in "${release_dirs[@]:keep_releases}"; do
      case "$old_release" in
        "$releases_dir"/*)
          echo "[maintenance] removing $old_release"
          rm -rf -- "$old_release"
          ;;
        *)
          echo "[maintenance] 拒绝清理越界路径：$old_release" >&2
          exit 2
          ;;
      esac
    done
  fi
fi

echo '=== AFTER: df -h / ==='
df -h /
echo '=== AFTER: docker system df ==='
docker system df
echo '[maintenance] volumes and containers were not pruned'
