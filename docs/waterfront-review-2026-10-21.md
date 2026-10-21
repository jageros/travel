# 滨水区攻略：待审稿与来源核验说明

核验日期：2026-10-21。文章文件：`src/content/articles/sf-waterfront-transit-itinerary.md`。

## 状态与审核边界

- 状态固定为 `review`，没有 `publishedAt`，没有新增人工审批或发布记录。
- 复用主题池中的独立意图：如何用公共交通安排可缩短的滨水区游览日。
- 只新增本文与本说明；不修改来源注册、主题池、照片注册、既有五篇或发布账本。
- 来源核验工作并行补录了 `muni-f-platform-boarding` 与 `muni-f-accessible-stop-pattern`；本文引用这两条受有效期保护的记录，本文作者未修改来源注册。两条记录实际抓取哈希与原已批准的 `sfmta-f-access` 基线一致，来源更新不等于本文获批。
- 本文通过格式检查不等于获得人工批准。首五篇发布门槛、每滚动七天最多三篇和现有自动发布开关继续有效。

## 实际查阅的官方资料

1. [SFMTA：F Market & Wharves](https://www.sfmta.com/routes/f-market-wharves)
   - 逐项读取两个方向的站名与行驶描述，而非只看线路标题。
   - 往 Wharf 方向包含 Ferry Building、Embarcadero/Stockton（Pier 39）、Jefferson/Powell、Jefferson/Taylor；回程列表包括 Beach/Mason、Beach/Stockton，并有独立的 Ferry Building 回程站。
   - 本文仅将这些名称作为读者在当前官方列表中定位的示例，不给出发车频率、首末班、行驶分钟数、站点编号或当日运行保证。
   - 复用已注册动态事实 `muni-f-waterfront`；其有效期与是否可展示以来源注册、健康记录和事实展示组件为准，本文没有延长有效期。
2. [SFMTA：Access on Historic Streetcars](https://www.sfmta.com/getting-around/accessibility/muni-accessibility/muni-access-guide/access-historic-streetcars)
   - 阅读了车辆差异、wayside platform / lift、登乘与下车说明。
   - 官方对于 Embarcadero 站台的说明不能推导为 Jefferson / Beach 全部站点、设备当前运行或景点入口均已核实。
   - 本文采用“首程上车—目的地下车—返程上车—最后下车”四点核验步骤，不发布无障碍通行保证，不把步行当成所有人的兜底。
   - 两条新录入事实在事实组件中展示；到期或来源异常后降级至官方查询入口，不把精确设备操作条件硬编码到正文。

另外实际打开了以下官方站点详情页，用于交叉检查页面名称与证据边界：

- [Ferry Building，往 Wharf 方向](https://www.sfmta.com/stops/embarcaderoferry-bldg-14513)
- [Embarcadero/Stockton（Pier 39）](https://www.sfmta.com/stops/embarcadero-stockton-st-pier-39-14530)
- [Jefferson/Powell](https://www.sfmta.com/stops/jefferson-st-powell-st-15174)
- [Beach/Mason](https://www.sfmta.com/stops/beach-st-mason-st-13092)
- [Beach/Stockton](https://www.sfmta.com/stops/beach-st-stockton-st-13095)

站点页的静态抓取包含未解析的预测模板及“Stop closed - no service”标签，不能据此判定该站停运。Beach/Mason 页面还展示早于本次核验日期的活动提示。稿件没有复制该活动为当前事件，也没有从预测缺失推断停运。

## 新增价值与内容去重

- 给出短版与延伸版：先选必须完成的目的地，再决定是否增加 Wharf，明确删去延伸段仍能完成出行目标。
- 分开 Ferry Building→Pier 39 与 Pier 39→Wharf 两个决策点，不依靠编造的步行时间包装固定行程。
- 用“步行体验、保存体力、赶后续安排、不能步行”四种情形选择乘车或缩短路线，避免无条件推荐走路。
- 具体解释返程站并非原下车站，提供按方向查找的站名表；表格不冒充最近入口或无障碍路径证明。
- 把机场接驳、票种覆盖和价格计算留给现有文章，仅在行程确定后链接通票比较，不重复一篇机场或通票文。

## 图片与未核实事项

复用照片 `muni-streetcar`：Grendelkhan，CC BY-SA 4.0，现有本地原图与照片注册均保留。照片实际为 Embarcadero 近 Pier 33 的 F-line 街车；本文明确其为历史照片，不承诺当天安排同一车辆。没有新增外链图片、版权假设或照片修改。

没有现场踏勘、乘车测试、设备检查或景点入口审计；没有验证实时预测、座位、车辆安排或精确步行路径。读者仍须核实旅行日期的服务、具体站点、设备与目的地入口。若以后需要独立的无障碍攻略，必须先补齐站点级官方证据和相应事实注册，不能把本文的四点检查建议当作完成现场验证。

## 校验结果

- 英文正文 1,273 词，6 个二级章节，3 张决策表；意图/正文去重检查没有命中已有五篇。
- `npm run validate:content`：6 篇通过。`npm run check`：61 个文件，0 errors / 0 warnings / 0 hints。
- 本地 review build：17 页，`verify:build` 通过；新稿的正文、真实本地图片、表格和站内链接已生成，页面带 review 提示与 `noindex, nofollow`，canonical 指向新主站，不输出已发布 Article schema，不进入 sitemap。
- 最终版本引用 `muni-f-waterfront`、`muni-f-platform-boarding`、`muni-f-accessible-stop-pattern`，正文仍不硬编码价格、时刻或设备当前可用性。
- 最终 production build：14 页，`verify:build` 通过。本机 Astro 静态预览实测三个现有正式攻略均 200；通票稿、桥梁稿及本文均为真实 HTTP 404。生产 sitemap 保持 9 个 URL，无本文；这不是一次新的 Cloudflare 远端 HTTP 验收。
- 最终 review build 在补充事实引用后再次通过，17 页；未生成新审批或发布记录。
- 本文当前内容摘要（`articleDigest`，不含状态/发布日期）为 `8c70de85b51ed9f9e07f35fb4e095529de36eb83e2411cd629311b3260e8960d`。如正文或编辑元数据再修改，应重新核对摘要，不能用此说明代替具名人工审核。
- 本地生产隔离证据保存在 ignored 文件 `artifacts/waterfront-content-validation.json`。本次临时预览服务器已关闭。
