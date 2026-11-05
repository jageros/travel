# 可跨电脑取得的未应用候选

这组文本在 2026-11-02 准备，2026-11-05 从原 ignored 交付包移入版本管理。**它不是正式文章目录，不会建立站点路由，也不表示批准、发布、远程 CI 或 Cloudflare 预览完成。**

| 本目录文件 | 以后普通 PR 的目标路径 | 状态 |
| --- | --- | --- |
| [src/content/articles/sf-cable-car-vs-historic-streetcar.md](src/content/articles/sf-cable-car-vs-historic-streetcar.md) | `src/content/articles/sf-cable-car-vs-historic-streetcar.md` | 原候选为 review；需要按新 main 和最新官方资料重新审阅 |
| [automation/gsc-opportunities.json](automation/gsc-opportunities.json) | `automation/gsc-opportunities.json` | 原始真实查询词的编辑输入，非原始统计文件；若已有更新导出，不覆盖 |

完整性与历史检查范围见 [manifest.json](manifest.json)。`contentSha256` 是仓库 `articleDigest`，`fileSha256` 是文件原始字节校验值，两者用途不同。保留原 `checkedAt`/`updatedAt` 不代表今天重新核验；不能通过改日期让稿件过门禁。

重新接续时先读 [当前交接](../README.md) 和 [路线图](../roadmap.md)，对比目标路径与最新 main，再决定采用/修改哪些文本。不自动批量复制到内容目录，不改批准或发布账本。2026-11-04 的报告中 `sfmta-f-line` 已 changed，会阻止这篇候选发布；先逐项语义处理来源变化。

原始统计 ZIP/CSV、完整官方抓取正文和测试日志仍在原机 ignored artifacts，不随 clone 提供；这里保存已准备稿件、允许提交的查询词输入及必要元数据。不得从这些汇总重建或声称拥有缺失的原始导出。
