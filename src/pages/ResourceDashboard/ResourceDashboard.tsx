import { useState } from 'react'
import styles from './ResourceDashboard.module.css'

// ─────────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────────

interface Person { name: string; title: string }
interface DeptInfo {
  count: number
  city: 'bj' | 'xmn'
  subgroups: Record<string, Person[]>
}

const bjData: Record<string, DeptInfo> = {
  "Linker": { count: 34, city: "bj", subgroups: {
    "OMS & DI": [{name:"Hao Yan(闫浩)",title:"Team Leader"},{name:"Bin Wang(王斌)",title:"Software Engineer"},{name:"Fangjie Deng(邓芳杰)",title:"Software Engineer"},{name:"Fuzheng Wang(王傅正)",title:"Software Engineer"},{name:"Hongming Dou(豆红明)",title:"Software Engineer"},{name:"Naiveson Li(李建钊)",title:"Software Engineer"},{name:"Shuaishuai Zhang(张帅帅)",title:"Software Engineer"}],
    "Implementation (EDI)": [{name:"Shelia Sun(孙榕)",title:"EDI高级经理"},{name:"Eaden Wu(伍志强)",title:"EDI高级工程师"},{name:"Mia Chen(陈朝美)",title:"EDI高级工程师"},{name:"Jingxuan Liu（刘竞轩）",title:"EDI工程师"},{name:"Linggang Wu（吴令刚）",title:"EDI工程师"},{name:"Livia Dai(戴涓)",title:"EDI工程师"},{name:"Wendy Sun（孙盼）",title:"EDI Engineer"},{name:"Yuwei Zhang（张育玮）",title:"EDI工程师"}],
    "BA": [{name:"Spencer Zhang(张雨竹)",title:"BA"},{name:"Yujuan Wang（王玉娟）",title:"BA"},{name:"Zhenyan Guo(郭振雁)",title:"BA"}],
    "Client Portal": [{name:"Tianhao Cui(崔天昊)",title:"Team Leader"},{name:"Deshuai Shi（师德帅）",title:"Software Engineer"},{name:"Yongqiang Zheng(郑永强)",title:"Software Engineer"}],
    "Intern": [{name:"Fulin Song（宋福霖）",title:"Intern"},{name:"Huiqiang Wu（武惠强）",title:"Intern"},{name:"Jialuo Cai（蔡佳洛）",title:"Intern"},{name:"Qinwei Cui（崔秦玮）",title:"Intern"},{name:"Weihao Luo（罗炜昊）",title:"Intern"}],
    "QA": [{name:"Eddie Yang(杨梦天)",title:"QA"},{name:"Limin Cao（曹利民）",title:"QA"}],
    "Others": [{name:"Coco Wang(汪随厉)",title:"PM Supervisor"},{name:"Victor Cui（崔翔）",title:"Senior BSD"},{name:"Xiankun Zhang(张宪坤)",title:"Software Engineer"},{name:"Emma Hua(华宇)",title:"Marketplace Operations Manager"},{name:"Long Shan(单龙)",title:"Team Leader (Marketing CMS)"},{name:"Shiqing Cao（曹世青）",title:"Software Engineer (Payment)"},{name:"Manman Ge(葛曼曼)",title:"Software Engineer (Ship)"}],
  }},
  "Enterprise Applications Group (EAG)": { count: 19, city: "bj", subgroups: {
    "Calculation Engine": [{name:"Guiqian Zhang(张贵谦)",title:"Application Engineer"},{name:"Jinjin Guo(郭金金)",title:"QA"},{name:"Yifan Liu（刘一凡）",title:"Application Engineer"},{name:"Zhenyan Wang(王振炎)",title:"Application Engineer"}],
    "Fulfillment & Foundation": [{name:"Meng Liang(梁萌)",title:"Team Leader"},{name:"Lee LI(李鑫)",title:"Application Engineer"}],
    "CRM & VRM": [{name:"Kai Li(李恺)",title:"Team Leader"},{name:"May Wu(武玥)",title:"BA"}],
    "RMS & CYC": [{name:"Sam(Sam Huang)",title:"Team Leader"},{name:"Aimee Cao(曹浩然)",title:"Software Engineer"}],
    "Financial": [{name:"Jiqing Yang(杨吉清)",title:"Team Leader"},{name:"Fangli Ma（马方利）",title:"Financial Assistant"},{name:"Yiming Zhang（张一明）",title:"Financial Assistant"}],
    "WFE & Apihub": [{name:"Lei Zhang(张蕾)",title:"Team Leader"}],
    "Management": [{name:"Alan Li(李威)",title:"Senior BSD"},{name:"Cunliang Gao（高存良）",title:"DBA Engineer"},{name:"Listen Li(李森)",title:"QA"},{name:"Peng Li(李鹏)",title:"Software Engineer"},{name:"Tierui Liu(刘铁锐)",title:"PM"},{name:"Xiao Fan(范阳景)",title:"PM"}],
  }},
  "IDC Intelligent Dispatch Center": { count: 18, city: "bj", subgroups: {
    "YMS": [{name:"Matt(Matt Wang)",title:"Team Leader"},{name:"Esther(Esther Chen)",title:"QA"},{name:"Soren(Soren Su)",title:"Software Engineer"},{name:"Wade(Wade Zhang)",title:"Software Engineer"},{name:"Zhanpeng Li(李占鹏)",title:"Software Engineer"}],
    "HRM & Recruit": [{name:"Yihuan Yang（杨易寰）",title:"Team Leader"},{name:"Hua Liu(刘华)",title:"Software Engineer"},{name:"Jack Wang(王炳午)",title:"Software Engineer"},{name:"Xuan Zhao（赵煊）",title:"Software Engineer"}],
    "APS": [{name:"Rainy(Rainy Wang)",title:"Team Leader"},{name:"Yuna(Yuna Wu)",title:"QA"}],
    "IoT": [{name:"Shihe Li（李世河）",title:"Software Engineer"},{name:"Zhende Gu（顾振德）",title:"Software Engineer"}],
    "General": [{name:"Arthur Liu（刘亚斌）",title:"BSD"},{name:"Hao Dong（董浩）",title:"Software Engineer"},{name:"Heng Zhang（张恒）",title:"QA"},{name:"Mingqiang Zhu（朱明强）",title:"Software Engineer"},{name:"Yong Wei（魏永）",title:"Software Engineer"},{name:"Humeng Zuo（左胡萌）",title:"Intern"}],
  }},
  "AI Marketplace": { count: 8, city: "bj", subgroups: {
    "AI Delivery": [{name:"Torin(Torin Lu)",title:"Team Leader"},{name:"Hanson Wang(王海生)",title:"高级产品经理"},{name:"Junjun Su（苏军军）",title:"AI Software Engineer"},{name:"Nancy Wu（吴琼）",title:"FDE"},{name:"Pengxiang Ning（宁鹏翔）",title:"AI Software Engineer"},{name:"Yuehua Wu（武月华）",title:"FDE"},{name:"Yuxin Guo（郭育鑫）",title:"FDE"}],
    "AI Products": [{name:"Anne Liu（刘翠雪）",title:"Business Analyst"}],
  }},
  "Semantic AI Layer": { count: 8, city: "bj", subgroups: {
    "Team": [{name:"Lingge Zhang（张凌阁）",title:"AI研发经理"},{name:"Lulu Zhao（赵路路）",title:"高级产品经理"},{name:"Bingyi Chen（陈炳屹）",title:"BA"},{name:"Guobin Sun（孙国彬）",title:"Software Engineer"},{name:"Hang Zhong（钟航）",title:"FDE"},{name:"Nix Li(李鹏飞)",title:"Software Engineer"},{name:"Shitong Li（李仕通）",title:"Software Engineer"},{name:"Yaowei Feng(冯耀威)",title:"FDE"}],
  }},
  "AI-Agent": { count: 7, city: "bj", subgroups: {
    "Team": [{name:"Zhan Ren(任展)",title:"高级研发经理"},{name:"Mingzhe Cao(曹铭哲)",title:"Software Engineer"},{name:"Wenjian Li（李文剑）",title:"Large Model Dev Engineer"},{name:"Xiaokui Cui(崔晓奎)",title:"AI Engineer"},{name:"Xiuli Gao(高秀丽)",title:"Software Engineer"},{name:"Kun Huang（黄昆）",title:"Intern"},{name:"Zixuan Tang（唐子轩）",title:"Intern"}],
  }},
  "BI": { count: 6, city: "bj", subgroups: {
    "Team": [{name:"Eric Tan(谭幸)",title:"Team Lead"},{name:"Cuiping He(何翠平)",title:"BI工程师"},{name:"Dimon(Dimon Su)",title:"BI"},{name:"Eileen(Eileen Chen)",title:"BI"},{name:"Xinyu Xue(薛新宇)",title:"BI工程师"},{name:"Xiong Qiao(乔雄)",title:"BI工程师"}],
  }},
  "IT (Beijing)": { count: 6, city: "bj", subgroups: {
    "Team": [{name:"Mike Wang（王之业）",title:"IT总监"},{name:"Zhiwei Liu(刘志伟)",title:"高级系统工程师"},{name:"Cliz Gao(高鹏)",title:"网络工程师"},{name:"Qingmin Li(栗庆民)",title:"网络安全工程师"},{name:"Xiaolei Sun（孙小雷）",title:"系统工程师"},{name:"Yangyang Yang（杨洋洋）",title:"系统工程师"}],
  }},
  "Supply BA Team": { count: 6, city: "bj", subgroups: {
    "Team": [{name:"Wei Liu（刘威）",title:"高级产品经理"},{name:"Charles(Charles Zeng)",title:"BA (APS)"},{name:"Peijia Li（李沛珈）",title:"BA (HRM)"},{name:"Jiaming Wang（王佳明）",title:"高级产品经理 (IOT)"},{name:"Nathan(Nathan Chen)",title:"项目产品经理 (YMS)"},{name:"Shuo Wang(王硕)",title:"BA (YMS)"}],
  }},
  "Architecture & Platform": { count: 5, city: "bj", subgroups: {
    "Team": [{name:"John Du(杜军红)",title:"高级架构工程师"},{name:"Haiyu Song（宋海宇）",title:"Software Engineer"},{name:"Yuntang Li（李运堂）",title:"DBA高级工程师"},{name:"Hao Jiang（姜昊）",title:"Intern"},{name:"Haoyu Xiong（熊浩宇）",title:"Intern"}],
  }},
  "WCS": { count: 5, city: "bj", subgroups: {
    "Team": [{name:"Brant Ji(纪如义)",title:"规划经理"},{name:"Neil Zhou(周园)",title:"设备经理"},{name:"Gavin Yang(杨中良)",title:"BA"},{name:"Jian Li（李健）",title:"规划工程师"},{name:"Wanlong Ji（季万龙）",title:"ROS Engineer"}],
  }},
  "Administration & Management": { count: 4, city: "bj", subgroups: {
    "Team": [{name:"Jun Liu(刘军)",title:"总经理"},{name:"Emma Feng(冯海京)",title:"办公室经理"},{name:"Eve Wei(魏玲玲)",title:"人事行政"},{name:"Vincent Li(李炜辰)",title:"人力资源经理"}],
  }},
  "AI (R&D)": { count: 4, city: "bj", subgroups: {
    "Team": [{name:"Foster Li(李欣宇)",title:"AI"},{name:"Lola Gou(缑李敏)",title:"Backend"},{name:"Qian Chen(陈茜)",title:"AI工程师"},{name:"Will Liu(刘彦勇)",title:"运维开发工程师"}],
  }},
  "BSD": { count: 3, city: "bj", subgroups: {
    "Team": [{name:"Alan Li(李威)",title:"Senior BSD"},{name:"Arthur Liu（刘亚斌）",title:"BSD"},{name:"Victor Cui（崔翔）",title:"Senior BSD"}],
  }},
  "PM": { count: 3, city: "bj", subgroups: {
    "Team": [{name:"Coco Wang(汪随厉)",title:"PM Supervisor"},{name:"Tierui Liu(刘铁锐)",title:"PM"},{name:"Xiao Fan(范阳景)",title:"PM"}],
  }},
  "Others (BJ)": { count: 6, city: "bj", subgroups: {
    "Delivery": [{name:"Chi Wei(魏迟)",title:"Manager"},{name:"Deshuai Zhu（朱德帅）",title:"Software Engineer"}],
    "Misc": [{name:"Weinan Wang（王伟楠）",title:"高级产品经理"},{name:"Xion Li(李雄飞)",title:"Software Engineer"},{name:"Wenjing Fan(范文静)",title:"仓储设计师"},{name:"Weichao Li(李伟超)",title:"Sales Director"}],
  }},
}

const xmnData: Record<string, DeptInfo> = {
  "WMS": { count: 19, city: "xmn", subgroups: {
    "Management": [{name:"Quinn(Quinn Chen)",title:"Manager"},{name:"Tommy(Tommy Xie)",title:"PM"}],
    "Inbound & Outbound": [{name:"Shaw(Shaw Xiao)",title:"Team Leader"},{name:"Cassie(Cassie Luo)",title:"QA"},{name:"Jepson(Jepson Lin)",title:"Software Engineer"},{name:"Wesley(Wesley Lin)",title:"Business Analyst"}],
    "Inventory": [{name:"Kiya(Kiya Lin)",title:"Team Leader"},{name:"Abby(Abby Wu)",title:"Software Engineer"},{name:"Levent(Levent Li)",title:"Business Analyst"},{name:"Neo(Neo Liao)",title:"Software Engineer"}],
    "WES & Automation": [{name:"Yuri(Yuri Lin)",title:"Team Leader"},{name:"Andrew(Andrew Qiu)",title:"Software Engineer"},{name:"Beica(Beica Wang)",title:"QA"},{name:"Jim(Jim Jian)",title:"Software Engineer"}],
    "OMS / Report / Special": [{name:"Alan(Alan Gao)",title:"Software Engineer"},{name:"Paul(Paul Yang)",title:"Software Engineer"},{name:"William(William Chen)",title:"Software Engineer"}],
    "L2 Support": [{name:"John(John Chen)",title:"Software Engineer"},{name:"Xion Li(李雄飞)",title:"Software Engineer"}],
  }},
  "Al Marketplace": { count: 25, city: "xmn", subgroups: {
    "AI Delivery Team": [{name:"Torin(Torin Lu)",title:"Team Leader"},{name:"Hanson Wang(王海生)",title:"高级产品经理"},{name:"Junjun Su（苏军军）",title:"AI Software Engineer"},{name:"Nancy Wu（吴琼）",title:"FDE"},{name:"Pengxiang Ning（宁鹏翔）",title:"AI Software Engineer"},{name:"Yuehua Wu（武月华）",title:"FDE"},{name:"Yuxin Guo（郭育鑫）",title:"FDE"},{name:"David(David Gao)",title:"FDE"},{name:"Jason(Jason Wang)",title:"FDE"},{name:"Taylor(Taylor Zhang)",title:"Business Analyst"},{name:"Vicky(Vicky Chen)",title:"PM"}],
    "Agent Factory / Al Products": [{name:"Carly(Carly Wang)",title:"产品运营"},{name:"Eben(Eben Xu)",title:"AI Engineer"},{name:"Hugh(Hugh Tang)",title:"AI Specialist"},{name:"Nico(Nico Yuan)",title:"AI Engineer"},{name:"Orin(Orin Qian)",title:"AI Engineer"},{name:"Ye(Ye Chen)",title:"AI Engineer"},{name:"Zen(Zen Chen)",title:"AI Engineer"}],
    "Al-Native Marketplace": [{name:"Jeff(Jeff Lin)",title:"Team Leader"},{name:"Anne Liu（刘翠雪）",title:"Business Analyst"},{name:"Jenna(Jenna Fu)",title:"Business Analyst"},{name:"Joel(Joel Cai)",title:"Software Engineer"},{name:"Victor(Victor Wei)",title:"Software Engineer"}],
    "General": [{name:"Cloud(Cloud Li)",title:"视频剪辑"},{name:"Tay(Tay Wu)",title:"Manager"}],
  }},
  "Delivery": { count: 14, city: "xmn", subgroups: {
    "Management": [{name:"Chi Wei(魏迟)",title:"Manager"}],
    "TMS": [{name:"Carl(Carl Wu)",title:"Team Leader"},{name:"Elvis(Elvis Yan)",title:"Software Engineer"},{name:"Lucas(Lucas Chen)",title:"Software Engineer"},{name:"Mia(Mia Yang)",title:"Software Engineer"},{name:"Shayne(Shayne Huang)",title:"Software Engineer"},{name:"Will(Will Zheng)",title:"Software Engineer"},{name:"Willie(Willie Su)",title:"Software Engineer"}],
    "Drayage": [{name:"Andy(Andy Zhang)",title:"Team Leader"},{name:"Deshuai Zhu（朱德帅）",title:"Software Engineer"},{name:"Elio(Elio Lin)",title:"Software Engineer"},{name:"Seven(Seven Xiao)",title:"QA"}],
    "WFM": [{name:"Ace(Ace Miao)",title:"Software Engineer"},{name:"Evelyn(Evelyn Zheng)",title:"QA"}],
  }},
  "Finance": { count: 29, city: "xmn", subgroups: {
    "DA / Billing": [{name:"Phoebe(Phoebe Zheng)",title:"DA Manager"},{name:"Nicole(Nicole Yu)",title:"Billing Supervisor"},{name:"Sylvia(Sylvia Bao)",title:"DA Supervisor"},{name:"Iris(Iris Huang)",title:"DA Senior"},{name:"Monica(Monica Miao)",title:"DA Senior"},{name:"Jessie(Jessie Liu)",title:"DA Professional"},{name:"Niki(Niki Zeng)",title:"Billing Professional"},{name:"Christine(Christine Zhang)",title:"Billing Claim"},{name:"Fayra(Fayra Shi)",title:"Billing Junior"},{name:"Johanna(Johanna Chen)",title:"Billing Junior"},{name:"Ruby(Ruby Huang)",title:"DA Junior"}],
    "Accounting": [{name:"Sherry(Sherry Bai)",title:"Senior Accounting Manager"},{name:"Eliza(Eliza LV)",title:"GL Supervisor (Corp&IA)"},{name:"Catherine(Catherine Hong)",title:"GL Supervisor (UF)"},{name:"Grace(Grace Guo)",title:"GL Supervisor (UT)"},{name:"Lucy(Lucy Chen)",title:"Senior Accountant"},{name:"Felix(Felix Liu)",title:"Senior Accountant"},{name:"Crystal(Crystal Liu)",title:"IA Junior"},{name:"Yi(Yi Fan)",title:"Junior Accountant"},{name:"Carrie(Carrie Zhang)",title:"Junior Accountant"},{name:"Zoey(Zoey Zheng)",title:"Junior Accountant"},{name:"Elena(Elena Zhang)",title:"Junior Accountant"},{name:"Rachel(Rachel Cong)",title:"Junior Accountant"}],
    "Business Analyst": [{name:"Connie(Connie Gu)",title:"Finance Director"},{name:"Corffin(Corffin Lyu)",title:"BA Manager"},{name:"Geovani(Geovani Zhang)",title:"Business Analyst"},{name:"Kaylin(Kaylin Wu)",title:"Business Analyst"},{name:"Liam(Liam Zhang)",title:"BA Professionalist"}],
    "Purchasing": [{name:"Winnie(Winnie Wang)",title:"Purchasing Specialist"}],
  }},
  "R&D": { count: 12, city: "xmn", subgroups: {
    "R&D": [{name:"Leyo(Leyo Guan)",title:"Manager"},{name:"Amy(Amy Fang)",title:"QA"},{name:"Cheney(Cheney Xie)",title:"Software Engineer"},{name:"Gary(Gary Liu)",title:"GIS"},{name:"Link(Link Huang)",title:"Software Engineer"},{name:"Neil(Neil Chen)",title:"Software Engineer"},{name:"Stella(Stella Zheng)",title:"QA"},{name:"Doria(Doria Li)",title:"项目支持"}],
    "WCS": [{name:"Fanson(Fanson Tang)",title:"Team Leader"},{name:"Asher(Asher Lin)",title:"Software Engineer"},{name:"Brian(Brian Li)",title:"Software Engineer"},{name:"Marion(Marion Zhao)",title:"Software Engineer"}],
  }},
  "Support": { count: 11, city: "xmn", subgroups: {
    "General": [{name:"Bruce(Bruce Hu)",title:"XMN General Manager"},{name:"Devin(Devin Chen)",title:"Team Leader"},{name:"Tracy(Tracy Huang)",title:"Team Leader"},{name:"Chuan(Chuan Tang)",title:"Software Engineer"}],
    "L1S": [{name:"Anna(Anna Rao)",title:"Support Specialist"},{name:"Didi(Didi Deng)",title:"Senior Support Specialist"},{name:"Helen(Helen Jiang)",title:"Support Specialist"},{name:"Maria(Maria Cai)",title:"Senior Support Specialist"},{name:"Mona(Mona Wang)",title:"Support Specialist"}],
    "Apple Project / Auto QA": [{name:"Allen(Allen Gao)",title:"Application"},{name:"Sliver(Sliver Zhang)",title:"Team Leader (Auto QA)"}],
  }},
  "Cubework": { count: 19, city: "xmn", subgroups: {
    "Development": [{name:"Aaron(Aaron Lee)",title:"Team Leader"},{name:"Shawn(Shawn Fang)",title:"Team Leader"},{name:"Anson(Anson Lin)",title:"AI Agent Engineer"},{name:"Arvin(Arvin Li)",title:"React Engineer"},{name:"Hank(Hank Wu)",title:"Software Engineer"},{name:"Joseph(Joseph Lin)",title:"Software Engineer"},{name:"Kaden(Kaden Wu)",title:"Software Engineer"},{name:"Zeta(Zeta Huang)",title:"Software Engineer"},{name:"Lynn(Lynn Huang)",title:"UX"},{name:"Eight(Eight Wu)",title:"Software Engineer"}],
    "Marketing": [{name:"Jack(Jack Tu)",title:"Social and Paid Ads Lead"},{name:"Angee(Angee Yang)",title:"广告投放与社群运营"},{name:"Ella(Ella Chen)",title:"Marketing Operation Specialist"},{name:"Finn(Finn Chen)",title:"Social Media Operator"},{name:"Mila(Mila Xie)",title:"社群内容运营"},{name:"Ravine(Ravine Zheng)",title:"市场营销策划"},{name:"Teresa(Teresa Zheng)",title:"社群内容运营"},{name:"Tina(Tina Liu)",title:"Video Producer"},{name:"Yeasy(Yeasy Ye)",title:"Brand Visual Designer"}],
  }},
  "YMS": { count: 5, city: "xmn", subgroups: {
    "Team": [{name:"Matt(Matt Wang)",title:"Team Leader"},{name:"Esther(Esther Chen)",title:"QA"},{name:"Nathan(Nathan Chen)",title:"项目产品经理"},{name:"Soren(Soren Su)",title:"Software Engineer"},{name:"Wade(Wade Zhang)",title:"Software Engineer"}],
  }},
  "APS": { count: 3, city: "xmn", subgroups: {
    "Team": [{name:"Rainy(Rainy Wang)",title:"Team Leader"},{name:"Charles(Charles Zeng)",title:"Business Analyst"},{name:"Yuna(Yuna Wu)",title:"QA"}],
  }},
  "CSR": { count: 3, city: "xmn", subgroups: {
    "Team": [{name:"Robin(Robin Zhu)",title:"Team Leader"},{name:"Ethan(Ethan Huang)",title:"Application"},{name:"Luke(Luke Huang)",title:"Software Engineer"}],
  }},
  "BI (XMN)": { count: 2, city: "xmn", subgroups: {
    "Team": [{name:"Dimon(Dimon Su)",title:"BI"},{name:"Eileen(Eileen Chen)",title:"BI"}],
  }},
  "IT&DevOps": { count: 3, city: "xmn", subgroups: {
    "Team": [{name:"Eason(Eason Chen)",title:"Manager"},{name:"Patton(Patton Huang)",title:"DevOps"},{name:"Yousri(Yousri)",title:"DevOps"}],
  }},
  "Human Resource": { count: 2, city: "xmn", subgroups: {
    "Team": [{name:"Fannie(Fannie Zhang)",title:"HRM"},{name:"Jean(Jean Yuan)",title:"HR"}],
  }},
  "AIA": { count: 1, city: "xmn", subgroups: { "Team": [{name:"Magic(Magic Wang)",title:"AI Engineer"}] }},
  "RMS": { count: 1, city: "xmn", subgroups: { "Team": [{name:"Sam(Sam Huang)",title:"Team Leader"}] }},
  "Admin (XMN)": { count: 1, city: "xmn", subgroups: { "Team": [{name:"Alina(Alina Lin)",title:"Admin"}] }},
  "Customer Experience": { count: 1, city: "xmn", subgroups: { "Team": [{name:"Kevin(Kevin Wang)",title:"Software Engineer"}] }},
  "Purchasing (XMN)": { count: 1, city: "xmn", subgroups: { "Team": [{name:"Ben Liao(廖焕彬)",title:"采购"}] }},
}

const DUPLICATES = [
  "Hanson Wang(王海生)","Junjun Su（苏军军）","Nancy Wu（吴琼）","Pengxiang Ning（宁鹏翔）",
  "Torin(Torin Lu)","Yuehua Wu（武月华）","Yuxin Guo（郭育鑫）","Anne Liu（刘翠雪）",
  "Dimon(Dimon Su)","Eileen(Eileen Chen)","Xion Li(李雄飞)","Chi Wei(魏迟)",
  "Deshuai Zhu（朱德帅）","Sam(Sam Huang)","Rainy(Rainy Wang)","Yuna(Yuna Wu)",
  "Esther(Esther Chen)","Matt(Matt Wang)","Soren(Soren Su)","Wade(Wade Zhang)",
  "Charles(Charles Zeng)","Nathan(Nathan Chen)",
]

// ─────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────

function simplifyTitle(t: string): string {
  if (/team leader|leader/i.test(t)) return 'Team Leader'
  if (/software engineer|engineer/i.test(t)) return 'Engineer'
  if (/\bqa\b/i.test(t)) return 'QA'
  if (/pm|product manager|产品/i.test(t)) return 'PM/BA'
  if (/ba|business analyst/i.test(t)) return 'PM/BA'
  if (/intern/i.test(t)) return 'Intern'
  if (/manager|经理/i.test(t)) return 'Manager'
  if (/director|总监/i.test(t)) return 'Director'
  if (/accountant|accounting/i.test(t)) return 'Accountant'
  if (/billing|da /i.test(t)) return 'DA/Billing'
  if (/devops/i.test(t)) return 'DevOps'
  if (/ai engineer|ai agent/i.test(t)) return 'AI Engineer'
  if (/fde/i.test(t)) return 'FDE'
  return t.split(' ').slice(0, 2).join(' ')
}

function DeptCard({ name, info, onClick }: { name: string; info: DeptInfo; onClick: () => void }) {
  const allPeople = Object.values(info.subgroups).flat()
  const roleCounts: Record<string, number> = {}
  for (const p of allPeople) {
    const r = simplifyTitle(p.title)
    roleCounts[r] = (roleCounts[r] || 0) + 1
  }
  const topRoles = Object.entries(roleCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const isXmn = info.city === 'xmn'

  return (
    <div className={`${styles.deptCard} ${isXmn ? styles.xmnCard : ''}`} onClick={onClick}>
      <div className={styles.dcHead}>
        <div className={styles.dcName}>{name}</div>
        <div className={`${styles.dcCount} ${isXmn ? styles.xmnCount : ''}`}>{info.count}</div>
      </div>
      <div className={styles.dcRoles}>
        {topRoles.map(([r, c]) => (
          <span key={r} className={`${styles.rolePill} ${isXmn ? styles.xmnPill : ''}`}>
            {r}{c > 1 ? ` ×${c}` : ''}
          </span>
        ))}
      </div>
      <div className={styles.dcFoot}>点击查看明细 →</div>
    </div>
  )
}

function Modal({ name, info, onClose }: { name: string; info: DeptInfo; onClose: () => void }) {
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{name}</h3>
          <button className={styles.modalClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalStat}>
            <div className={styles.modalStatItem}>
              <div className={styles.msn}>{info.count}</div>
              <div className={styles.msl}>人员总数</div>
            </div>
            <div className={styles.modalStatItem}>
              <div className={styles.msn}>{Object.keys(info.subgroups).length}</div>
              <div className={styles.msl}>子组数量</div>
            </div>
          </div>
          {Object.entries(info.subgroups).map(([group, people]) => (
            <div key={group} className={styles.modalSubgroup}>
              <h4>{group} ({people.length})</h4>
              <div className={styles.peopleList}>
                {people.map((p) => (
                  <div key={p.name} className={styles.personChip}>
                    {p.name}
                    <span className={styles.ptitle}>{p.title}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ResourceDashboard() {
  const [modal, setModal] = useState<{ name: string; info: DeptInfo } | null>(null)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>PMO Resource Dashboard</h1>
          <div className={styles.pageSubtitle}>北京 · 厦门人员分布总览 | Beijing &amp; Xiamen Headcount</div>
        </div>
        <span className={styles.dateBadge}>2026-09-28</span>
      </div>

      <div className={styles.container}>
        {/* Summary Cards */}
        <div className={styles.summaryGrid}>
          <div className={`${styles.summaryCard} ${styles.cardTotal}`}>
            <div className={styles.num}>291</div>
            <div className={styles.lbl}>总记录数<br />Total Records</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardBj}`}>
            <div className={styles.num}>139</div>
            <div className={styles.lbl}>北京人员<br />Beijing</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardXmn}`}>
            <div className={styles.num}>152</div>
            <div className={styles.lbl}>厦门人员<br />Xiamen</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardDup}`}>
            <div className={styles.num}>22</div>
            <div className={styles.lbl}>跨城市重复<br />Cross-city Dup.</div>
          </div>
          <div className={`${styles.summaryCard} ${styles.cardUnique}`}>
            <div className={styles.num}>269</div>
            <div className={styles.lbl}>去重总人数<br />Total Unique</div>
          </div>
        </div>

        {/* Duplicates */}
        <div className={styles.sectionHeader}>
          <h2>跨城市重复人员 Cross-city Duplicates</h2>
          <span className={styles.tagDup}>同时出现在北京和厦门名单中 · 22人</span>
        </div>
        <div className={styles.dupBox}>
          <div className={styles.dupTags}>
            {DUPLICATES.map((name) => (
              <span key={name} className={styles.dupTag}>{name}</span>
            ))}
          </div>
        </div>

        {/* Beijing */}
        <div className={styles.citySection}>
          <div className={styles.cityLabel}>
            <span className={`${styles.cityDot} ${styles.dotBj}`} />
            北京 Beijing &nbsp;·&nbsp; <span className={styles.bjNum}>139人</span>
          </div>
          <div className={styles.deptGrid}>
            {Object.entries(bjData).map(([name, info]) => (
              <DeptCard key={name} name={name} info={info} onClick={() => setModal({ name, info })} />
            ))}
          </div>
        </div>

        {/* Xiamen */}
        <div className={styles.citySection}>
          <div className={styles.cityLabel}>
            <span className={`${styles.cityDot} ${styles.dotXmn}`} />
            厦门 Xiamen &nbsp;·&nbsp; <span className={styles.xmnNum}>152人</span>
          </div>
          <div className={styles.deptGrid}>
            {Object.entries(xmnData).map(([name, info]) => (
              <DeptCard key={name} name={name} info={info} onClick={() => setModal({ name, info })} />
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modal && <Modal name={modal.name} info={modal.info} onClose={() => setModal(null)} />}
    </div>
  )
}
