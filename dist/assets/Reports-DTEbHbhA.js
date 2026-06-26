import{a as e,n as t,t as n}from"./jsx-runtime-D57Vegw5.js";import{c as r,l as i,n as a,r as o}from"./useProjectIssues-DL7E1UTn.js";import{t as s}from"./riskEngine-CdziR63t.js";import{n as c,t as l}from"./useWecomSend-ByF3lVYn.js";import{n as u}from"./AppContext-vuiWzryR.js";import{n as d}from"./I18nContext-D9TJNbnI.js";import{t as f}from"./jiraClient-CNERDsp-.js";import{n as p}from"./statusMapper-CiZoORw0.js";import{t as m}from"./useSprintHistory-ypuzWm-w.js";import{t as h}from"./AIInsight-B6IySa9C.js";var g=e(t(),1),_={page:`_page_hdmyj_1`,header:`_header_hdmyj_3`,headerLeft:`_headerLeft_hdmyj_12`,title:`_title_hdmyj_13`,subtitle:`_subtitle_hdmyj_14`,quickCards:`_quickCards_hdmyj_17`,quickCard:`_quickCard_hdmyj_17`,quickCardIcon:`_quickCardIcon_hdmyj_36`,quickCardLabel:`_quickCardLabel_hdmyj_37`,quickCardDesc:`_quickCardDesc_hdmyj_38`,layout:`_layout_hdmyj_41`,card:`_card_hdmyj_49`,cardTitle:`_cardTitle_hdmyj_56`,table:`_table_hdmyj_63`,selected:`_selected_hdmyj_83`,statusBadge:`_statusBadge_hdmyj_85`,statusDraft:`_statusDraft_hdmyj_91`,statusPushed:`_statusPushed_hdmyj_92`,btnLink:`_btnLink_hdmyj_94`,btnPush:`_btnPush_hdmyj_105`,preview:`_preview_hdmyj_119`,previewTitle:`_previewTitle_hdmyj_128`,previewContent:`_previewContent_hdmyj_138`,previewPre:`_previewPre_hdmyj_144`,previewEmpty:`_previewEmpty_hdmyj_154`,loading:`_loading_hdmyj_162`,errorBanner:`_errorBanner_hdmyj_171`,filterBar:`_filterBar_hdmyj_191`,filterSelect:`_filterSelect_hdmyj_199`,filterReset:`_filterReset_hdmyj_212`},v=n();function y(e,t){return i({queryKey:[`multi-sprint-issues`,e,t.join(`|`)],queryFn:async()=>{if(!e||t.length===0)return[];let n=r(e),i=`${n.length===1?`project = ${n[0]}`:`project IN (${n.join(`, `)})`} AND ${`sprint IN (${t.map(e=>`"${e}"`).join(`, `)})`} AND issuetype != Sub-task ORDER BY priority ASC, updated DESC`;return(await f.searchIssues(i,[`summary`,`status`,`priority`,`assignee`,`labels`,`fixVersions`,`created`,`updated`,`timeoriginalestimate`,`timespent`,`customfield_10016`,`customfield_10004`,`customfield_11000`,`customfield_11103`],0,200)).issues.map(p)},enabled:!!e&&t.length>1,staleTime:300*1e3})}var b=[{type:`daily`,labelKey:`reports.daily`,descKey:`reports.dailyDesc`,icon:`📅`},{type:`weekly`,labelKey:`reports.weekly`,descKey:`reports.weeklyDesc`,icon:`📊`},{type:`sprint_review`,labelKey:`reports.sprint`,descKey:`reports.sprintDesc`,icon:`🎯`},{type:`daily`,labelKey:`reports.monthly`,descKey:`reports.monthlyDesc`,icon:`📈`},{type:`weekly`,labelKey:`reports.collaboration`,descKey:`reports.collaborationDesc`,icon:`🤝`}];function x(e,t,n,r){let i=n.length,a=n.filter(e=>e.status===`done`).length,o=n.filter(e=>e.status===`in_progress`).length,s=n.filter(e=>e.status===`in_review`).length,c=n.filter(e=>e.status===`in_testing`).length,l=n.filter(e=>e.status===`todo`).length,u=i>0?Math.round(a/i*100):0,d=r.filter(e=>e.level===`high`),f=r.filter(e=>e.level===`medium`),p=n.filter(e=>e.priority===`P0`&&e.status!==`done`),m=n.filter(e=>e.priority===`P1`&&e.status!==`done`),h=n.filter(e=>!e.assignee&&e.status!==`done`),g=new Map;for(let e of n){let t=e.assignee?.name??`未分配`,n=g.get(t)??{name:t,total:0,done:0,inProgress:0};n.total++,e.status===`done`&&n.done++,e.status===`in_progress`&&n.inProgress++,g.set(t,n)}let _=Array.from(g.values()).sort((e,t)=>t.total-e.total),v=n.filter(e=>e.status===`done`).sort((e,t)=>new Date(t.updatedAt).getTime()-new Date(e.updatedAt).getTime()).slice(0,5),y=n.filter(e=>e.status===`in_progress`).sort((e,t)=>{let n={P0:0,P1:1,P2:2,P3:3};return(n[e.priority]??9)-(n[t.priority]??9)}).slice(0,8),b=new Date().toLocaleDateString(`zh-CN`),x=_.slice(0,10).map(e=>{let t=e.total>0?Math.round(e.done/e.total*100):0;return`| ${e.name} | ${e.total} | ${e.done} | ${e.inProgress} | ${t}% |`}).join(`
`),S=d.length>0?d.map(e=>`- 🔴 ${e.description}${e.assignee?`（${e.assignee}）`:``}`).join(`
`):`- 暂无高危风险`,C=f.length>0?f.slice(0,5).map(e=>`- 🟡 ${e.description}${e.assignee?`（${e.assignee}）`:``}`).join(`
`):`- 暂无中危风险`;if(e===`daily`)return`# 日报 - ${b}
**${t}**

## 📊 Sprint 进度
- 总任务：${i} 个
- ✅ 已完成：${a}（${u}%）
- 🔄 进行中：${o} | 📋 待办：${l} | 🔍 评审：${s} | 🧪 测试：${c}

## 🔥 进行中的任务
${y.length>0?y.map(e=>`- [${e.priority}] ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`):`- 暂无进行中任务`}

## ✅ 最近完成
${v.length>0?v.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`—`}）`).join(`
`):`- 暂无`}

## ⚠️ 风险提醒
${S}
${p.length>0?`\n**P0 紧急未完成（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}`).join(`
`)}`:``}
${h.length>0?`\n**未分配任务：${h.length} 个**`:``}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`;if(e===`weekly`)return`# 周报 - ${t}
**报告日期：${b}**

## 📊 Sprint 整体进度
| 指标 | 数值 |
|------|------|
| 总任务 | ${i} |
| 已完成 | ${a}（${u}%）|
| 进行中 | ${o} |
| 评审中 | ${s} |
| 测试中 | ${c} |
| 待办 | ${l} |

## 👥 团队成员工作量
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${x}

## ✅ 本周完成的任务
${v.length>0?v.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`—`}）`).join(`
`):`- 暂无完成任务`}

## 🔄 当前进行中
${y.length>0?y.map(e=>`- [${e.priority}] ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`):`- 暂无`}

## ⚠️ 风险与阻塞
**高危风险（${d.length}个）：**
${S}

**中危风险（${f.length}个）：**
${C}

${p.length>0?`**P0 紧急未完成（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:``}
${m.length>0?`\n**P1 高优未完成（${m.length}个）：**\n${m.slice(0,5).map(e=>`- ${e.id} ${e.title}`).join(`
`)}`:``}
${h.length>0?`\n**⚠️ 未分配任务：${h.length} 个，需尽快分配**`:``}

## 📋 下周计划
- 继续推进 Sprint 剩余 ${i-a} 个任务
- 重点关注 ${p.length} 个 P0 任务和 ${d.length} 个高危风险
${h.length>0?`- 分配 ${h.length} 个未分配任务`:``}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`;if(e===`sprint_review`){let e=_.filter(e=>e.name!==`未分配`).slice(0,5),n=e.filter(e=>e.total>15),r=e.filter(e=>e.total<5);return`# Sprint 复盘报告 - ${t}
**报告日期：${b}**

## 📊 Sprint 概览
| 指标 | 数值 |
|------|------|
| 计划任务 | ${i} |
| 完成任务 | ${a} |
| 完成率 | ${u}% |
| 未完成 | ${i-a} |
| 高危风险 | ${d.length} |
| 中危风险 | ${f.length} |

## 👥 团队贡献
| 成员 | 总任务 | 已完成 | 进行中 | 完成率 |
|------|--------|--------|--------|--------|
${x}

${n.length>0?`**⚠️ 负载过高：** ${n.map(e=>e.name).join(`、`)}（任务数 > 15）`:``}
${r.length>0?`**💡 可承担更多：** ${r.map(e=>e.name).join(`、`)}（任务数 < 5）`:``}

## ⚠️ 风险回顾
**高危风险（${d.length}个）：**
${S}

**中危风险（${f.length}个）：**
${C}

## 📌 未完成任务分析
${p.length>0?`**P0 紧急（${p.length}个）：**\n${p.map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:`- 无 P0 遗留`}
${m.length>0?`\n**P1 高优（${m.length}个）：**\n${m.slice(0,8).map(e=>`- ${e.id} ${e.title}（${e.assignee?.name??`未分配`}）`).join(`
`)}`:``}

## 💡 改进建议
1. ${u<70?`完成率偏低，建议优化需求拆分和估算`:`完成率良好，继续保持`}
2. ${d.length>3?`高危风险较多，建议加强风险预警和提前干预`:`风险可控`}
3. ${h.length>5?`${h.length} 个任务未分配，建议优化任务分配流程`:`任务分配合理`}
4. ${n.length>0?`部分成员负载过高，建议平衡工作量`:`团队负载均衡`}

---
*本报告由 AI-PM 平台自动生成 · ${b}*`}return`报告内容生成中…`}function S(){let{currentUser:e,currentProjectKey:t}=u(),{t:n}=d(),[r,i]=(0,g.useState)(null),[f,p]=(0,g.useState)({}),[S,w]=(0,g.useState)(``),[T,E]=(0,g.useState)(``),[D,O]=(0,g.useState)(``),{sprints:k}=m(t),{data:A=[]}=o(t),j=A[0]??null,M=D?D.split(`|`).filter(Boolean):[],N=M.length===1?M[0]:null,P=N?k.find(e=>e.name===N)?.id??null:D?null:j?.id??null,{data:F=[],isLoading:I,isError:L,error:R}=a(M.length<=1?t:null,P,N??(D?null:j?.name??null)),{data:z=[],isLoading:B}=y(M.length>1?t:null,M.length>1?M:[]),V=M.length>1?z:F,H=(M.length>1?B:I)&&!!t,U=l(),W=e?.role===`DEV`,G=M.length>0?M.length<=2?M.join(` + `):`${M.length} 个 Sprint`:j?.name??t??`Project`,K=(0,g.useMemo)(()=>s(V),[V]),q=K.filter(e=>e.level===`high`).length,J=K.filter(e=>e.level===`medium`).length,Y=V.filter(e=>e.status===`done`).length,X=(0,g.useMemo)(()=>{let e=new Date().toISOString().slice(0,10),t=[{id:`report-daily-1`,type:`daily`,title:`${G} 日报`,date:e,status:f[`report-daily-1`]??`draft`,content:x(`daily`,G,V,K)},{id:`report-weekly-1`,type:`weekly`,title:`${G} 周报`,date:e,status:f[`report-weekly-1`]??`draft`,content:x(`weekly`,G,V,K)},{id:`report-sprint-1`,type:`sprint_review`,title:`${G} 复盘报告`,date:e,status:f[`report-sprint-1`]??`draft`,content:x(`sprint_review`,G,V,K)}];return W?t.filter(e=>e.type===`daily`):t},[G,V,Y,q,J,f,W]),Z=X.find(e=>e.id===r)??null,Q=(0,g.useMemo)(()=>X.filter(e=>!(S&&e.type!==S||T&&e.status!==T)),[X,S,T]),$=S!==``||T!==``||D!==``;function ee(){w(``),E(``),O(``)}function te(e){U.mutate(c(e),{onSuccess:()=>{p(t=>({...t,[e.id]:`pushed`}))}})}return(0,v.jsxs)(`div`,{className:_.page,children:[(0,v.jsx)(`div`,{className:_.header,children:(0,v.jsxs)(`div`,{className:_.headerLeft,children:[(0,v.jsx)(`h1`,{className:_.title,children:n(`reports.title`)}),(0,v.jsx)(`div`,{className:_.subtitle,children:n(`reports.subtitle`)})]})}),L&&(0,v.jsxs)(`div`,{className:_.errorBanner,children:[`⚠️ `,n(`dashboard.errorLoad`),`：`,R instanceof Error?R.message:n(`common.error`)]}),t&&V.length>0&&(0,v.jsx)(h,{title:n(`ai.insight`),buildPrompt:()=>{let e=V.filter(e=>e.status===`done`).length,n=V.filter(e=>e.status===`in_progress`).length;return`请基于以下数据生成一段简洁的项目进展摘要，可用于日报/周报：\n- 项目: ${t}\n- Sprint: ${j?.name??`无`}\n- 总任务: ${V.length}，已完成: ${e}，进行中: ${n}\n- 完成率: ${V.length>0?Math.round(e/V.length*100):0}%\n请用中文回答，给出：1. 本期进展摘要 2. 关键成果 3. 待解决问题`}}),(0,v.jsx)(`div`,{className:_.quickCards,children:b.map(e=>(0,v.jsxs)(`div`,{className:_.quickCard,children:[(0,v.jsx)(`div`,{className:_.quickCardIcon,children:e.icon}),(0,v.jsx)(`div`,{className:_.quickCardLabel,children:n(e.labelKey)}),(0,v.jsx)(`div`,{className:_.quickCardDesc,children:n(e.descKey)})]},e.labelKey))}),H?(0,v.jsx)(`div`,{className:_.loading,children:n(`common.loading`)}):(0,v.jsxs)(`div`,{className:_.layout,children:[(0,v.jsxs)(`div`,{className:_.card,children:[(0,v.jsx)(`div`,{className:_.cardTitle,children:n(`reports.reportList`)}),(0,v.jsxs)(`div`,{className:_.filterBar,style:{padding:`12px 16px 0`},children:[(0,v.jsx)(C,{sprints:k,selected:D,onSelect:O}),(0,v.jsxs)(`select`,{className:_.filterSelect,value:S,onChange:e=>w(e.target.value),children:[(0,v.jsx)(`option`,{value:``,children:n(`reports.allTypes`)}),(0,v.jsx)(`option`,{value:`daily`,children:n(`reports.daily`)}),(0,v.jsx)(`option`,{value:`weekly`,children:n(`reports.weekly`)}),(0,v.jsx)(`option`,{value:`sprint_review`,children:n(`reports.sprint`)})]}),(0,v.jsxs)(`select`,{className:_.filterSelect,value:T,onChange:e=>E(e.target.value),children:[(0,v.jsx)(`option`,{value:``,children:n(`reports.allStatus`)}),(0,v.jsx)(`option`,{value:`draft`,children:n(`reports.draft`)}),(0,v.jsx)(`option`,{value:`pushed`,children:n(`reports.pushed`)})]}),$&&(0,v.jsx)(`button`,{className:_.filterReset,onClick:ee,children:n(`common.reset`)})]}),(0,v.jsxs)(`table`,{className:_.table,children:[(0,v.jsx)(`thead`,{children:(0,v.jsxs)(`tr`,{children:[(0,v.jsx)(`th`,{children:n(`reports.type`)}),(0,v.jsx)(`th`,{children:n(`reports.reportTitle`)}),(0,v.jsx)(`th`,{children:n(`reports.date`)}),(0,v.jsx)(`th`,{children:n(`reports.status`)}),(0,v.jsx)(`th`,{children:n(`reports.actions`)})]})}),(0,v.jsx)(`tbody`,{children:Q.map(e=>{let t={daily:n(`reports.daily`),weekly:n(`reports.weekly`),sprint_review:n(`reports.sprint`)};return(0,v.jsxs)(`tr`,{className:r===e.id?_.selected:``,children:[(0,v.jsx)(`td`,{children:t[e.type]}),(0,v.jsx)(`td`,{children:e.title}),(0,v.jsx)(`td`,{children:e.date}),(0,v.jsx)(`td`,{children:(0,v.jsx)(`span`,{className:`${_.statusBadge} ${e.status===`pushed`?_.statusPushed:_.statusDraft}`,children:e.status===`pushed`?n(`reports.pushed`):n(`reports.draft`)})}),(0,v.jsxs)(`td`,{children:[(0,v.jsx)(`button`,{className:_.btnLink,onClick:()=>i(e.id),children:n(`common.view`)}),(0,v.jsx)(`button`,{className:_.btnPush,onClick:()=>te(e),disabled:U.isPending||e.status===`pushed`,children:U.isPending?n(`reports.pushing`):n(`reports.pushWecom`)})]})]},e.id)})})]})]}),(0,v.jsxs)(`div`,{className:_.preview,children:[(0,v.jsxs)(`div`,{className:_.previewTitle,children:[n(`reports.preview`),Z&&(0,v.jsx)(`span`,{style:{fontSize:12,color:`var(--text2)`,fontWeight:400},children:Z.title})]}),(0,v.jsx)(`div`,{className:_.previewContent,children:Z?(0,v.jsx)(`pre`,{className:_.previewPre,children:Z.content}):(0,v.jsx)(`div`,{className:_.previewEmpty,children:n(`reports.previewEmpty`)})})]})]})]})}function C({sprints:e,selected:t,onSelect:n}){let[r,i]=(0,g.useState)(!1),[a,o]=(0,g.useState)(``),s=(0,g.useRef)(null),c=t?t.split(`|`).filter(Boolean):[],l=e.filter(e=>e.name.toLowerCase().includes(a.toLowerCase())||(e.startDate??``).includes(a));(0,g.useEffect)(()=>{function e(e){s.current&&!s.current.contains(e.target)&&i(!1)}return r&&document.addEventListener(`mousedown`,e),()=>document.removeEventListener(`mousedown`,e)},[r]);function u(e){let t=new Set(c);t.has(e)?t.delete(e):t.add(e),n(t.size>0?Array.from(t).join(`|`):``)}function d(){n(l.map(e=>e.name).join(`|`))}function f(){n(``)}if(e.length===0)return null;let p=c.length===0?`当前 Sprint`:c.length<=2?c.join(`, `):`已选 ${c.length} 个`;return(0,v.jsxs)(`div`,{ref:s,style:{position:`relative`,display:`inline-block`},children:[(0,v.jsxs)(`div`,{className:_.filterSelect,onClick:()=>i(!r),style:{cursor:`pointer`,userSelect:`none`,minWidth:200,display:`inline-flex`,alignItems:`center`,gap:4},children:[(0,v.jsx)(`span`,{style:{flex:1,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:p}),(0,v.jsx)(`span`,{style:{opacity:.5,fontSize:10},children:r?`▲`:`▼`})]}),r&&(0,v.jsxs)(`div`,{style:{position:`absolute`,top:`100%`,left:0,zIndex:1e3,background:`var(--card, #fff)`,border:`1px solid var(--border, #e0e0e0)`,borderRadius:8,boxShadow:`0 8px 24px rgba(0,0,0,0.12)`,width:320,marginTop:4},children:[(0,v.jsx)(`div`,{style:{padding:`8px 12px`,borderBottom:`1px solid var(--border, #eee)`},children:(0,v.jsx)(`input`,{type:`text`,placeholder:`搜索 Sprint...`,value:a,onChange:e=>o(e.target.value),autoFocus:!0,style:{width:`100%`,padding:`6px 10px`,border:`1px solid var(--border, #ddd)`,borderRadius:4,fontSize:13,outline:`none`}})}),(0,v.jsxs)(`div`,{style:{padding:`4px 12px`,display:`flex`,gap:8,borderBottom:`1px solid var(--border, #eee)`},children:[(0,v.jsx)(`button`,{onClick:d,style:{fontSize:12,color:`var(--primary, #1677ff)`,background:`none`,border:`none`,cursor:`pointer`,padding:`4px 0`},children:`全选`}),(0,v.jsx)(`button`,{onClick:f,style:{fontSize:12,color:`var(--text2, #999)`,background:`none`,border:`none`,cursor:`pointer`,padding:`4px 0`},children:`清空`})]}),(0,v.jsxs)(`div`,{style:{maxHeight:240,overflowY:`auto`,padding:`4px 0`},children:[l.map(e=>(0,v.jsxs)(`label`,{style:{display:`flex`,alignItems:`center`,gap:8,padding:`6px 12px`,cursor:`pointer`,fontSize:13,transition:`background 0.1s`},onMouseEnter:e=>e.currentTarget.style.background=`#f0f5ff`,onMouseLeave:e=>e.currentTarget.style.background=`transparent`,children:[(0,v.jsx)(`input`,{type:`checkbox`,checked:c.includes(e.name),onChange:()=>u(e.name),style:{margin:0}}),(0,v.jsx)(`span`,{style:{flex:1,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.name}),(0,v.jsxs)(`span`,{style:{fontSize:11,color:`var(--text2, #999)`,flexShrink:0},children:[e.state===`active`?`🟢`:`⚪`,` `,e.startDate??``]})]},e.id)),l.length===0&&(0,v.jsx)(`div`,{style:{padding:12,textAlign:`center`,color:`var(--text2)`,fontSize:13},children:`无匹配结果`})]})]})]})}export{S as default};