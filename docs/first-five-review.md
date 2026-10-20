# Cedar Trips 首批五篇人工审阅包

稿件与来源检查日期：**2026-10-20**。五篇均保持 `status: review`，没有 `publishedAt`，也没有因本次编辑产生任何人工批准或发布记录。`author: editorial-team` 表示站点编辑署名，不表示已经获得某位真人批准，也不声称作者亲历、实测过路线或购买过车票。

本包先把完整成果交给用户阅读确认。下列路径需要在开启 `CONTENT_REVIEW_PREVIEW=true` 的预览站点访问；它们不是已经公开上线的页面。预览统一 noindex，具体预览域名由部署结果提供。

## 阅读顺序与每篇新增价值

| 顺序 | 英文标题与预览相对路径 | 回答的读者问题 | 本轮完成的主要决策增量 |
| --- | --- | --- | --- |
| 1 | **San Francisco without a car: plan the journeys before the sights** — `/guides/san-francisco-without-a-car/` | 第一次不租车去旧金山，先选住处、路线还是通票？ | 用机场与日常返回两段完整交通测试酒店；比较 downtown/BART、Wharf/末段换乘、其他交通走廊；将住宿与交通共同计入预算；按一条交通走廊安排一天。 |
| 2 | **BART vs Muni vs Clipper: what each name means for your trip** — `/guides/bart-vs-muni-clipper/` | 交通运营方、储值、通票和银行卡分别解决什么问题？ | 增加车辆与票种覆盖表；区分 cable car 与 historic streetcar；解释同卡支付不等于通票覆盖、银行卡身份优惠与换乘优惠不同；BART进出同一支付方式与Muni Metro不tap out分开说明。 |
| 3 | **SFO to Fisherman's Wharf with luggage: compare the whole transfer** — `/guides/sfo-to-fishermans-wharf-with-luggage/` | 带行李到渔人码头，公共交通、混合接驳还是直达车更合适？ | 展示 terminal → 机场站 → BART → Embarcadero街面F线 → Wharf具体停站 → 酒店入口的完整检查链；对照BART加车和机场直达车；以全组人数、适用换乘优惠和行李容量比较总成本。 |
| 4 | **Is a Muni pass worth it? Count fare windows, then compare** — `/guides/is-muni-pass-worth-it/` | 哪种实际行程值得买Muni day product或Visitor Passport？ | 新增不同一天活动安排的计费场景；比较 `N×S+K×C`、`D+K×C` 与 `P`；明确同一普通单价假设，有优惠或不同单价时改用实际票价求和；跨机构与机场费用另列。 |
| 5 | **Golden Gate Bridge without a car: choose a viewpoint or a crossing** — `/destinations/golden-gate-bridge-without-a-car/` | 看南端景观、走一段折返还是完整过桥，怎样安排回程？ | 按终点选择三种游览；将south-end北向下客与南向返城Toll Plaza分别检查；完整过桥要求先验证北端下客、步行接入与南端返城三段；当前时刻表优先于旧访客页中的线路编号。 |

首发建议为 **1 → 2 → 3**：总览提供入口，运营方与票种解释提供基础，机场接驳解决明确的到达问题。第4、5篇进入第二个发布窗口。首发三篇相互关联；尚未发布文章的正文链接由站点处理为可读文字，不提前给用户一个公开404链接。

五篇不是同一篇检查清单的五种标题：它们分别负责行程组织、支付边界、具体到达链、费用计算、景点起终点选择。后续新增内容仍需有独立问题；机场或金门桥的泛化checklist不因换标题另发一页。

## 官方核验发现及稿件处理

具体价格、票务有效时间、运行状态等动态值保存在 `automation/sources.json` 的事实记录，正文不硬编码当前票价或开关门时刻。来源健康状态、有效期和构建/客户端检查决定精确事实是否展示。事实不可用时，文章仍保留比较方法和官方查询入口。

| 核验点 | 2026-10-20发现 | 稿件处理与仍需旅行者当天确认的事项 |
| --- | --- | --- |
| Muni普通单程购买渠道 | [总票价页](https://www.sfmta.com/getting-around/muni/fares)提示MuniMobile单程已停售，但[单程详情页](https://www.sfmta.com/fares/single-ride-adult-ages-19-64)的渠道栏仍有MuniMobile。两页信息存在冲突。 | 单程支付说明指向已核实的Clipper/银行卡方式，不推荐在MuniMobile买单程。没有把页面矛盾解释成已经恢复销售。 |
| Day Pass与Passport | [Day Pass](https://www.sfmta.com/fares/day-pass)有自己的覆盖与销售渠道；[Passport](https://www.sfmta.com/fares/1-day-visitor-passport)覆盖Muni含cable car，但排除BART、其他运营方和SFO。Passport页面的app折扣句与同价渠道栏并不一致。 | 不沿用旧文中“Clipper不能买Day Pass”的说法；购买入口以各自产品页为准；不承诺某渠道更便宜。付款前仍需确认准确产品、激活与有效期。 |
| 同卡与换乘 | [Clipper官方](https://www.clippercard.com/contactless-payments)区分银行卡成人票、需要专用Clipper卡的身份优惠和同卡跨机构换乘优惠；SFMTA总表里的完整跨机构规则链接又返回单程页。 | 不写银行卡“没有任何优惠”；也不承诺每个operator pair、每次换乘都有固定减额。机场成本按适用优惠后的连接票价计算，普通Muni比较在单价变化时改为求和。 |
| SFO至Wharf交通链 | [BART机场页](https://www.bart.gov/guide/airport/sfo)与[F线停站页](https://www.sfmta.com/routes/f-market-wharves)支持机场站、城市段、Ferry Building走廊与Wharf停站的分段研究；F线返向停站与入向并非完全相同。 | 没有写“BART直接到Wharf”或同站台换乘。出站、街面站、方向及最后步行分别核对；返机场需重新按返向站表规划。没有给所有酒店通用的最后停站、耗时或车价。 |
| 金门桥旧路线信息 | [访客交通页](https://www.goldengate.org/bridge/visiting-the-bridge/public-transit/)仍引用旧线路，而[当前时刻表目录](https://www.goldengate.org/bus/schedules-maps/)及官方变更资料显示线路已调整。 | 不抄旧130/150，也不把替代线路推断为已验证的北端具体下客点。原访客页仅用于端口布局；实际班次以当前时刻表和旅行日planner确认。 |
| 北端接入与步道时刻 | 当前北端具体下客点未作独立现场/完整路径验证；[步道页](https://www.goldengate.org/bridge/visiting-the-bridge/bikes-pedestrians/)的施工提示与其链接新闻日期需要分别判断。 | 不承诺“第一站下车”、固定当晚开放时刻、整段step-free或普遍安全结论；北端连接未确认时改选南端游览/折返。读者仍须查看旅行日有效alerts、路径与返程。 |

这些矛盾没有被强行写成确定结论。已能确认的覆盖边界写清楚；未能确认的渠道折扣、北端具体下客点或当日时刻不作推荐依据。页面可读、返回HTTP成功或哈希未变化都不等于所有正文事实已得到语义核验。

逐源研究和机器抓取的最终状态见[本次官方来源复核记录](source-review-2026-10-20.md)及 `automation/source-health.json`。两者需要区分：官方内容的语义阅读已用于本轮编辑，机器基线采集仍可能因网络、代理或网站拒绝而失败。本包不把失败改成成功，也不把网页工具内容拼成机器基线。

机器基线未齐不妨碍用户完整阅读五篇正文、比较表、公式与图片；受影响的精确事实面板会显示官方查询入口。它仍会阻止正式发布：每篇所有引用来源都必须经过新鲜的机器检查，并满足已接受基线、证据、有效期等门禁。人工确认文稿本身不覆盖这些发布条件。

## 照片适配

五张原图均从已登记来源本地保存，作者、文件页、许可URL、拍摄日期和校验值见 `src/data/photos.json`。当前稿件只引用登记的 `photoId`，没有增加未授权外链图片。

| 稿件 | photoId | 署名与许可 | 适配边界 |
| --- | --- | --- | --- |
| 总览 | `city-cable-car` | l0da_ralta · CC BY 2.0 | Hyde Street城市交通场景，不把缆车照片当作普通单程车票的覆盖证明。 |
| 运营方解释 | `bart-train` | Michael Dunn · CC BY 2.0 | 原图是Dublin/Pleasanton展示列车，不标成SFO或旧金山市内车站。 |
| SFO接驳 | `sfo-bart` | Pi.1415926535 · CC BY-SA 4.0 | SFO站现代列车照片；历史照片不证明今日班次、站牌或票价。 |
| Muni比较 | `muni-streetcar` | Grendelkhan · CC BY-SA 4.0 | Embarcadero附近F线1059，是historic streetcar，不是cable car。 |
| 金门桥 | `golden-gate` | Blake Everett · CC0 1.0 | 从Torpedo Wharf看桥的景观照片，不作为南北端站口或导航地图。 |

预览需能看到署名、原文件页、许可链接及缩放/裁切说明；BY-SA照片的改编图保留相同许可。原图与许可证记录的核对不表示摄影者为本站背书。

## 用户确认方式与内容指纹

请逐篇阅读英文正文、来源事实面板、图片与相关链接，指出事实、清晰度或实用性问题。此文件仅记录代理完成的编辑整理与核对，**不代替用户/真实审核人的人工确认**。

以下SHA-256由 `scripts/content-lib.mjs` 的 `articleDigest` 计算，覆盖解析后的编辑元数据与正文；按实现排除 `status`、`publishedAt`。它不是Markdown文件原始字节哈希，也不包括独立来源登记或图片登记中的文本。来源记录变更仍需要单独检查；任何文章编辑后都必须重新计算指纹。

| slug | 待确认稿件SHA-256 |
| --- | --- |
| `san-francisco-without-a-car` | `95ca758995e7df9e7dd2e8c9df31614cf9d4abf5f416208a52ca49b4c00e0b80` |
| `bart-vs-muni-clipper` | `0cd30964d409a890a05001e771ea2f28c5ee5dc1fb59e7c334c644165c78d0e2` |
| `sfo-to-fishermans-wharf-with-luggage` | `7721e4a80be04978e8bf9ef89d97954c8116bce45363562f08aef88b9cfd9104` |
| `is-muni-pass-worth-it` | `73bc716399151dcba26a5dad80f9941cfca8ee52d72565f6ca7b9188283a284a` |
| `golden-gate-bridge-without-a-car` | `513707150908b0f95ff03c49897f05b7f5bddd2c823c78c9b5af00a80363a627` |

只读复算：

```sh
node scripts/content-pipeline.mjs --list-review
```

真实审核人明确确认具体稿件后，批准接口需要同时提供 `--approve SLUG --reviewer NAME --sha256 REVIEWED_DIGEST`，或在GitHub手动触发工作流时提供匹配的slug与指纹。确认人与指纹均不得伪造。批准与发布是两个独立动作；本轮没有执行任一动作。即使五篇全部批准，每滚动七天最多三篇的发布上限仍然适用。
