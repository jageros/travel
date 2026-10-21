# Cedar Trips 自动化验收 — 2026-10-21

本记录区分实际运行结果与尚未由定时事件验证的配置，不包含私钥或令牌。

## App 与真实运行

用户明确授权创建并仅向 `jageros/travel` 安装 **Cedar Trips Editorial**，权限为 Contents、Pull requests 读写及必需的 Metadata 只读。App 未加入分支保护绕过列表。公开 Client ID 已配置为仓库变量 `EDITORIAL_APP_CLIENT_ID`；用户于北京时间 10 月 21 日 10:06 将私钥直接保存到仓库 Actions Secret `EDITORIAL_APP_PRIVATE_KEY`。验收仅读取 Secret 名称及更新时间，没有读取其值。

[监测运行 #3](https://github.com/jageros/travel/actions/runs/39531510234) 从 `main` 的 `dd91175ceb0a6e386485bd8c1929ee3aa4c18472` 手动启动。五项可选输入全部为空或 false：未请求基线采纳、稿件批准、付费扩稿或文章发布。

实际结果如下：

- 官方 token action 成功生成限定本仓库的短期令牌；推送与 PR 操作日志均报告 `prAuthMode=github-app`。
- [PR #9](https://github.com/jageros/travel/pull/9) 由 `cedar-trips-editorial[bot]` 创建；[PR 事件 CI](https://github.com/jageros/travel/actions/runs/39531591625) 首次运行成功，触发身份为该 App。推送 CI `39531585617` 与额外的精确 SHA 调度 CI `39531591310` 也均成功。
- `github-actions[bot]` 通过 source-state 通道于北京时间 **10:11:54** 自动合并 PR，产生 `e435df783d8579bf6eb0723a584287204fc74b1d`。本轮没有手动批准工作流、重新运行 PR 检查、点击合并或绕过保护规则。
- post 步骤成功，日志明确报告 `Token revoked`。App 私钥没有输出到日志、对话、报告或客户端。
- [对应 Vercel 部署](https://vercel.com/jageros-projects/travel/8muUwJ6nCW5Qp2bE8YukojQvVnBR) 显示 Ready、Production、Current，主域名为 `www.cedartrips.com`，源码提交与上述 merge SHA 一致。

这证明手动启动后的完整自动链路可用。每日任务仍配置为 `15 1 * * *`，即北京时间 09:15；截至本次验收，近期记录尚未出现 schedule 事件，因此没有将“已配置定时”表述为“定时触发已实测”。

## 来源变化与内容边界

本次真实来源报告时间为 `2026-10-21T02:10:33.789Z`：10 个来源 unchanged，`sfmta-fares` 为 changed，`conflicts=[]`。原批准基线没有被自动替换；变化进入 `source-monitor` 待审队列。其余 10 个来源核验日续至 10 月 21 日，9 条动态事实有效期续至 10 月 28 日。

### SFMTA 汇总页的基线复核

本次 AI 协助研究将昨日留存的原始 HTML 与重新取得的 [SFMTA 官方票价汇总页](https://www.sfmta.com/getting-around/muni/fares) 用仓库现有 `extractText()` 标准化，完成全页词级对照。昨日原文的 hash 精确匹配原批准基线；今日使用现有 `fetchOfficialText()` 实际取得的 hash 精确匹配上述 runner 报告。

| 比较项 | SHA-256 |
| --- | --- |
| 原批准基线及昨日留存原文 | `c90f547a90c703350bd9ebfd10e3253e9edf95f0f12e693b40dcc4872f65ca58` |
| 今日独立抓取及 runner 观察值 | `e519e560d8a5c3f802677cb799387f9420a56ce26385a1a079002290fbf7cfb4` |

差异仅有 Travel Transit Updates 活动侧栏的两项变化：新增 10 月 24 日 St. Jude Pilgrimage 活动、移除 Hayes Valley Farmers Market 活动。票价、覆盖、购买渠道及换乘规则正文逐字未变。这不是票价变化，现有稿件引用仍成立，不需要改动已批准文章。10 月 20 日记录的 MuniMobile 渠道等旧文矛盾仍按既有边界处理。

该复核由本次 Codex 协助研究及维护操作执行，使用显式人工操作路径，不代表用户另行审阅了来源或新增文章批准。接纳的仅是该真实快照的 hash，随后变化仍须重新待审。

普通复核 PR 将来源批准 hash 更新为上表新值，并将当前观察值与新基线的比较状态重算为 unchanged；原观察 hash、每行抓取时间和报告总时间 `2026-10-21T02:10:33.789Z` 均保持原样，未将人审时间伪装为新抓取。该来源没有注册动态 facts；其 source.checkedAt 记实际复核日 10 月 21 日，其他事实没有因人工接纳而续期。只关闭对应 `sfmta-fares: changed` 待审项，两个配额等待项保留。原 changed 结果继续保存在 PR #9、运行报告及 artifact 中。基线变化不能使用健康自动合并通道，必须通过普通 PR、CI 和显式复核后合并；下一次完整 runner 再独立确认新基线并产生新的真实抓取时间。

五篇文章的已批准指纹全部保持不变；发布账本仍为 3 篇，另 2 篇保持 review。三条发布记录均保留 `2026-10-20T12:18:20.750Z`，没有增加或改写批准、正文、发布日期。滚动七天额度仍为 3/3；最早恢复时间为北京时间 **10 月 27 日 20:18:20.750**，下一次已配置的日常检查为 **10 月 28 日 09:15**，仍须通过当时的来源、证据、CI 和发布条件。

## 生产 HTTP 验收

北京时间 10:16:17—21 实际请求生产域名：首发三篇均 200，静态 HTML 的正文、表格、已发内链、index/follow 及新 www canonical 正常；两篇 review 与未知路径均真实 404/noindex。sitemap 仍为 200、9 个正确地址，robots 允许抓取并声明新 www sitemap。

三篇源码的动态事实记录已显示核验日 10 月 21 日、有效期 10 月 28 日，说明来源状态已随部署更新；默认静态 HTML 仍隐藏精确动态结论，由客户端检查日期后显示。文章头部的人工核验日和 Article 发布/修改日期保持 10 月 20 日，没有将自动来源续验冒充文章改写。

未配置付费扩稿供应商、模型或预算，未调用付费模型。广告继续关闭。自动化接入的 71 项测试已在 PR #8 和主分支 CI 通过；本次来源更新也通过普通工作流验证，未对无代码改动重复运行本地全套测试。
