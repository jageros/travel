# Cedar Trips：Codex 接续入口

本仓库是 Cedar Trips 的代码、内容与运营记录。新电脑或新会话先阅读本文件，再读 [当前交接](docs/handoff/README.md)、[推进历史](docs/handoff/history.md) 和 [后续计划](docs/handoff/roadmap.md)。这些文件足以开始工作，不需要原聊天或原电脑的 Codex memory。

## 目标与范围

- 面向美国英语读者，优先推荐全美各地值得去的景点，以官方来源支持出行决策。旧金山无车游作为独立专题继续维护。
- 唯一正式地址 `https://www.cedartrips.com`；Cloudflare Worker `cedar-trips`；GitHub `jageros/travel`。
- Astro 静态正文，React 渐进增强搜索，Markdown 内容；Node 24，`npm ci` 使用锁文件。保留免费托管，无数据库、CMS 或 SSR。
- 广告保持关闭。未确定供应商、模型及费用上限，不配置或调用付费扩稿接口。广告开户、条款、身份和支付由用户完成。

## 开始工作

1. 先检查工作区、分支和最新可访问的远程 `main`，保留未提交改动；本地旧 ref 不代表远端现状。新分支使用 `codex/` 前缀。
2. 按交接文件重新读取来源健康、待审队列、发布账本、当前文章和真实部署。交接中的日期、SHA、配额和访问限制均是快照。
3. 区分本地检查、PR 必过 CI、Cloudflare 预览、合并及生产部署，不能互相代替。
4. 正式操作依当前授权与工具能力进行；新电脑需要重新连接账号，仓库不携带会话、工具授权或密钥。

## 不可绕过的内容规则

- `automation/editorial.json` 是历史发布和当前自动发布账本。首五篇由 `jageros` 批准的精确版本保留原 digest；后续自动生成稿记录精确 digest 和发布时间，不虚构审核人。
- 使用 `scripts/content-lib.mjs` 的 `articleDigest`，它不是 Markdown 原始文件 SHA。只有 `status`、`publishedAt` 等实现明确排除的字段不会改变该指纹。
- 按北京时间自然日从当前账本重算配额。每天最多发布三篇，有合格稿件时安排一至三篇。2026 年 11 月 19 日过渡当天的上限为四篇，额外名额用于当日用户要求的单篇发布。来源、证据或质量未通过时保留阻塞。
- 发布需要当前官方抓取、报告及逐项来源在 24 小时内、已接受基线匹配、动态事实未过期、证据和质量检查通过。失败抓取不能冒充新核验。
- 自动工作流只在官方来源抓取成功、登记 evidence 片段全部存在且没有事实冲突时推进 changed 来源的 baseline 和证据日期；缺失 evidence、人工事实、不可用来源和过期事实继续保持阻塞。
- 所有符合主题、来源、事实、重复、质量和当日配额门禁的后续稿件可自动生成和发布，不补造人工审批。文章变更仍重新计算 `articleDigest`。
- 内容和来源状态由当前 Codex 会话的本地 scheduled task 在生产验证通过、提交竞态检查通过后直接提交 `main`。程序和 workflow 代码变更仍按普通受保护 PR 交付；生产部署、HTTP 和 sitemap 仍需单独核对。
- 正式构建排除 review/draft；预览始终 noindex、无 GA/广告、sitemap 为空。不得因迁移或预览验收打开广告。

## 资料与访问边界

- `automation/sources.json`、`automation/source-health.json`、文章与照片许可登记是事实检查输入；`topics.json` 的 `ready` 和查询词仅是选题输入。
- 不虚构亲历、票价、路线可达性、许可、关键词量、排名、增长、广告收入或成本。优先使用来源与许可已核实的真实照片，保留本地文件、署名、许可和改编说明。缺少合适照片时可使用明确标记为 AI illustration 的本地封面，登记生成来源、日期和提示词摘要。插画不能用作景点现状、路线或设施的证据。
- 仅导入真实可下载的 Search Console 查询词；原始统计导出与运行日志留在 ignored `artifacts/`。不可用的数据不是零，不同日期/聚合口径不能拼成增长率。
- 账号标识与已验证流程见交接；私钥只留 GitHub Actions Secret，不读取或展示密钥来证明其存在，不复制到 Cloudflare 或仓库。
- 403、浏览器 origin deny、账号登录、仓库 public/private 是不同问题。遇到明确拒绝，不用 SSH 凭证、raw CDP、替代浏览器或其他通道规避；保留可读检查，报告实际限制。访问恢复后重新验证，不把历史拒绝永久当成当前事实。
- 只操作本站；不扩大权限、不修改其他网站、不自行接受新服务条款或开通付费服务。

## 验证与记录

常用命令和有副作用的命令见 [接续操作](docs/handoff/README.md#新电脑的接续顺序)。内容/程序变更按 `.github/workflows/ci.yml` 检查生产与预览；纯文档变更检查链接、事实、候选文件完整性和 `git diff --check`，不将历史测试冒充本次执行。

完成实质工作时更新 `docs/handoff/README.md` 的日期快照，向 `history.md` 追加已发生的事件，并调整 `roadmap.md`。保留历史验收记录原貌，不把计划写成完成。待交付文本必须进入受版本管理的交接目录，不能只留下原机绝对路径或 ignored ZIP。
