# Vendor 仓库说明

英文版见 [README.en.md](README.en.md)。

这里用于管理外部第三方仓库的固定版本。

所有需要锁定的外部仓库都定义在 `vendor/manifest.json` 中。

执行下面的命令后：

```bash
pnpm vendor:sync
```

脚本会把每个仓库克隆到：

```text
vendor/repos/<name>
```

并且检出到清单中指定的 commit，避免开发和部署时依赖漂移。
