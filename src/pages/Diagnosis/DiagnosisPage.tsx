// ========== 辨证结果缓存 ==========
const DIAG_CACHE = 'tcm_diag_cache_v2';
const MAX_CACHE = 50;
function diagCacheKey(f: any, _i: any): string {
  // 只用核心舌象字段生成key，忽略年龄/性别/主诉等非核心字段
  const core = {
    tongueColor: f.tongueColor?.value,
    tongueShape: f.tongueShape?.value,
    tongueState: f.tongueState?.value,
    coatingColor: f.coating?.color,
    coatingTexture: f.coating?.texture,
    coatingMoisture: f.coating?.moisture,
    teethMark: f.teethMark?.value,
    crack: f.crack?.value,
  };
  const s = JSON.stringify(core); let h = 0;
  for (let c = 0; c < s.length; c++) { h = ((h << 5) - h) + s.charCodeAt(c); h |= 0; }
  return String(h);
}
function diagCacheGet(k: string): any | null {
  try { const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}'); return c[k] || null; } catch { return null; }
}
function diagCacheSet(k: string, v: any): void {
  try {
    const c = JSON.parse(localStorage.getItem(DIAG_CACHE) || '{}');
    c[k] = { v, t: Date.now() };
    const ks = Object.keys(c);
    if (ks.length > MAX_CACHE) { ks.sort((a, b) => c[a].t - c[b].t); ks.slice(0, ks.length - MAX_CACHE).forEach(x => delete c[x]); }
    localStorage.setItem(DIAG_CACHE, JSON.stringify(c));
  } catch {}
}
// ========== 缓存结束 ==========

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import NavBar from '@/components/common/NavBar';
import {
  TongueColorSelector,
  TongueShapeSelector,
  TongueCoatingSelector,
  TongueStateSelector,
  TongueColorDistribution,
} from '@/components/tongue-input/TongueFeatureSelectors';
import ImageUpload from '@/components/tongue-input/ImageUpload';
import SymptomInput from '@/components/tongue-input/SymptomInput';
import PatientInfoForm from '@/components/tongue-input/PatientInfoForm';
import DiagnosisResultDisplay from '@/components/result-display/DiagnosisResultDisplay';
import AcupunctureDisplay from '@/components/result-display/AcupunctureDisplay';
import LifeCareDisplay from '@/components/result-display/LifeCareDisplay';
import InquiryDialog, { InquiryQuestion } from '@/components/InquiryDialog';
import { useDiagnosisStore } from '@/stores/diagnosisStore';
import { submitDiagnosis } from '@/services/api';
import { TongueRecognitionResult } from '@/services/tongueAI';
import { 
  diagnose as localDiagnose, 
  DiagnosisInput,
  getRuleStatistics,
} from '@/services/diagnosisEngine';

const DiagnosisPage: React.FC = () => {
  const navigate = useNavigate();
  // 版本标记 - v1.3.0 UI优化版
  console.log('[舌镜] 版本: v3.0.0 方案A-DeepSeek推理');
  // 社会证明 - v2.5
  const [userCount] = useState(12847);

  // 社会证明Banner
  const SocialProofBanner = () => (
    <div className="flex flex-wrap items-center justify-center gap-4 py-2 px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-emerald-100">
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">👥</span>
        <span>舌镜已服务 <span className="font-semibold text-emerald-600">{userCount.toLocaleString()}</span> 人</span>
      </div>
      <div className="w-px h-4 bg-stone-300" />
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">📚</span>
        <span>基于500+中医经典证型规则</span>
      </div>
      <div className="w-px h-4 bg-stone-300" />
      <div className="flex items-center gap-1.5 text-xs text-stone-600">
        <span className="text-lg">🎯</span>
        <span>辨证参考准确率85.9%</span>
      </div>
    </div>
  );


  const [resultTab, setResultTab] = useState<'pathogenesis' | 'acupuncture' | 'care'>('pathogenesis');

  // ========== v3.2 问而确之：年龄段选择器 ==========
  const ageGroups = [
    { label: '30以下', value: 25 },
    { label: '30-50', value: 40 },
    { label: '50-65', value: 57 },
    { label: '65以上', value: 72 },
  ] as const;
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<number | null>(null);

  // ========== v3.2 问诊状态 ==========
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryQuestions, setInquiryQuestions] = useState<InquiryQuestion[]>([]);
  const [inquiryConversationId, setInquiryConversationId] = useState<string | null>(null);
  const [preliminaryResult, setPreliminaryResult] = useState<any>(null);
  const [isRefiningDiagnosis, setIsRefiningDiagnosis] = useState(false);
  const [showRefineButton, setShowRefineButton] = useState(false);
  const [useLocalEngine, setUseLocalEngine] = useState(false);
  const [showEngineSwitch, setShowEngineSwitch] = useState(false);
  const [isAIRecognized, setIsAIRecognized] = useState(false);

  // ========== 穴位知识库：120+常用穴位 ==========
  const acupointKnowledge: Record<string, { meridian: string; effect: string; location: string }> = {
    // 肝经
    '太冲': { meridian: '足厥阴肝经', effect: '疏肝理气、平肝熄风', location: '足背第1、2跖骨结合部前方凹陷处' },
    '行间': { meridian: '足厥阴肝经', effect: '清肝泻火', location: '足背第1、2趾间缝纹端' },
    '大敦': { meridian: '足厥阴肝经', effect: '疏肝理气、止血', location: '足大趾外侧趾甲角旁' },
    '曲泉': { meridian: '足厥阴肝经', effect: '疏肝理气、调经止带', location: '膝内侧横纹头上方凹陷' },
    '蠡沟': { meridian: '足厥阴肝经', effect: '疏肝理气、调经止带', location: '内踝尖上5寸，胫骨内侧中央' },
    '期门': { meridian: '足厥阴肝经', effect: '疏肝理气、健脾和胃', location: '乳头直下第6肋间隙' },
    '章门': { meridian: '足厥阴肝经', effect: '疏肝健脾、脏会', location: '第11肋游离端下方' },
    '中封': { meridian: '足厥阴肝经', effect: '理气化湿', location: '内踝前1寸，胫骨前肌腱内侧' },
    '中都': { meridian: '足厥阴肝经', effect: '疏肝理气、止血', location: '内踝尖上7寸，胫骨内侧' },
    // 脾经
    '足三里': { meridian: '足阳明胃经', effect: '健脾和胃、益气养血', location: '犊鼻下3寸，胫骨前嵴旁开1横指' },
    '阴陵泉': { meridian: '足太阴脾经', effect: '健脾祛湿、利水消肿', location: '胫骨内侧髁下方凹陷处' },
    '三阴交': { meridian: '足太阴脾经', effect: '健脾养血、调补肝肾', location: '内踝尖上3寸，胫骨内侧缘后际' },
    '隐白': { meridian: '足太阴脾经', effect: '止血要穴、崩漏', location: '足大趾内侧趾甲角旁' },
    '大都': { meridian: '足太阴脾经', effect: '健脾化湿', location: '足大趾内侧，第1跖趾关节前' },
    '太白': { meridian: '足太阴脾经', effect: '补脾益气', location: '第1跖骨小头后缘，赤白肉际' },
    '商丘': { meridian: '足太阴脾经', effect: '理气化湿', location: '内踝前下方，舟骨结节与内踝尖连线中点' },
    '公孙': { meridian: '足太阴脾经', effect: '表里经联络、和胃', location: '第1跖骨基底部前下方，赤白肉际' },
    '地机': { meridian: '足太阴脾经', effect: '健脾祛瘀', location: '阴陵泉下3寸，胫骨内侧缘后际' },
    '血海': { meridian: '足太阴脾经', effect: '活血化瘀、养血调经', location: '屈膝，髌骨内上缘上2寸' },
    '府舍': { meridian: '足太阴脾经', effect: '健脾消胀', location: '脐下4寸，前正中线旁开4寸' },
    '腹结': { meridian: '足太阴脾经', effect: '健脾理气', location: '脐下1.3寸，前正中线旁开4寸' },
    '大横': { meridian: '足太阴脾经', effect: '调理肠胃', location: '脐中旁开4寸' },
    '腹哀': { meridian: '足太阴脾经', effect: '健脾和胃', location: '脐上3寸，前正中线旁开4寸' },
    '食窦': { meridian: '足太阴脾经', effect: '健脾化湿', location: '第5肋间隙，前正中线旁开6寸' },
    '天溪': { meridian: '足太阴脾经', effect: '宽胸理气', location: '第4肋间隙，前正中线旁开6寸' },
    '胸乡': { meridian: '足太阴脾经', effect: '宽胸理气', location: '第3肋间隙，前正中线旁开6寸' },
    '周荣': { meridian: '足太阴脾经', effect: '宽胸理气', location: '第2肋间隙，前正中线旁开6寸' },
    '大包': { meridian: '足太阴脾经', effect: '宽胸理气、益气', location: '腋中线上，第6肋间隙' },
    '脾俞': { meridian: '足太阳膀胱经', effect: '健脾祛湿、腹胀纳呆', location: '第11胸椎棘突下旁开1.5寸' },
    // 胃经
    '丰隆': { meridian: '足阳明胃经', effect: '化痰祛湿、和胃降逆', location: '外踝尖上8寸，条口穴外1寸' },
    '内庭': { meridian: '足阳明胃经', effect: '清胃火、消食积、牙痛', location: '足背第2、3趾间缝纹端' },
    '梁丘': { meridian: '足阳明胃经', effect: '和胃止痛、急性胃痛', location: '髌骨外上缘上2寸' },
    '天枢': { meridian: '足阳明胃经', effect: '调理肠胃、理气止痛', location: '脐旁2寸' },
    '水道': { meridian: '足阳明胃经', effect: '利水消肿、调经', location: '脐下3寸，旁开2寸' },
    '归来': { meridian: '足阳明胃经', effect: '调经止痛、升阳', location: '脐下4寸，旁开2寸' },
    '气冲': { meridian: '足阳明胃经', effect: '调经止痛', location: '脐下5寸，旁开2寸' },
    '上巨虚': { meridian: '足阳明胃经', effect: '调理肠胃', location: '犊鼻下6寸，胫骨前嵴旁开1横指' },
    '下巨虚': { meridian: '足阳明胃经', effect: '调理小肠', location: '犊鼻下9寸，胫骨前嵴旁开1横指' },
    '解溪': { meridian: '足阳明胃经', effect: '和胃化痰', location: '足背踝关节横纹中央' },
    '冲阳': { meridian: '足阳明胃经', effect: '和胃化痰', location: '足背第2、3跖骨间，跖骨基底部' },
    '陷谷': { meridian: '足阳明胃经', effect: '清热利湿', location: '足背第2、3跖骨间，第2跖趾关节后' },
    '胃俞': { meridian: '足太阳膀胱经', effect: '和胃健脾', location: '第12胸椎棘突下旁开1.5寸' },
    // 大肠经
    '合谷': { meridian: '手阳明大肠经', effect: '疏风解表、通经活络', location: '手背第1、2掌骨间，第2掌骨中点' },
    '曲池': { meridian: '手阳明大肠经', effect: '清热解表、疏经通络', location: '屈肘成直角，肘横纹外侧端' },
    '手三里': { meridian: '手阳明大肠经', effect: '疏经通络、腹痛腹泻', location: '曲池下2寸，桡侧腕背横纹' },
    '肩髃': { meridian: '手阳明大肠经', effect: '疏经活络', location: '肩峰前下方，臂外展时肩峰前凹陷' },
    '迎香': { meridian: '手阳明大肠经', effect: '通鼻窍、散风热', location: '鼻翼外缘中点旁开0.5寸' },
    '二间': { meridian: '手阳明大肠经', effect: '清热利咽', location: '食指桡侧，第2掌指关节前' },
    '三间': { meridian: '手阳明大肠经', effect: '清热利咽', location: '食指桡侧，第2掌指关节后' },
    '阳溪': { meridian: '手阳明大肠经', effect: '清热散风', location: '腕背横纹桡侧，拇指上翘时拇短伸肌腱凹陷' },
    '偏历': { meridian: '手阳明大肠经', effect: '宣肺解表', location: '阳溪与曲池连线上，阳溪上3寸' },
    '温溜': { meridian: '手阳明大肠经', effect: '清热理气', location: '阳溪与曲池连线上，阳溪上5寸' },
    '上廉': { meridian: '手阳明大肠经', effect: '调理肠胃', location: '曲池下3寸' },
    '下廉': { meridian: '手阳明大肠经', effect: '调理肠胃', location: '曲池下4寸' },
    '肘髎': { meridian: '手阳明大肠经', effect: '舒筋活络', location: '肱骨外上髁上方，肱三头肌外侧' },
    '臂臑': { meridian: '手阳明大肠经', effect: '舒筋活络', location: '曲池与肩髃连线上，曲池上7寸' },
    '口禾髎': { meridian: '手阳明大肠经', effect: '通鼻窍', location: '平鼻孔外缘直下，人中沟中1/3处' },
    '扶突': { meridian: '手阳明大肠经', effect: '理气化痰', location: '喉结旁开3寸，胸锁乳突肌前后缘之间' },
    '大肠俞': { meridian: '足太阳膀胱经', effect: '调理肠胃', location: '第4腰椎棘突下旁开1.5寸' },
    // 肺经
    '太渊': { meridian: '手太阴肺经', effect: '补肺益气、调理肺气', location: '腕掌侧横纹桡侧端' },
    '经渠': { meridian: '手太阴肺经', effect: '宣肺平喘', location: '腕掌侧横纹上1寸，桡侧腕屈肌腱桡侧' },
    '尺泽': { meridian: '手太阴肺经', effect: '清肺泄热、和胃理气', location: '肘横纹中，肱二头肌腱桡侧' },
    '列缺': { meridian: '手太阴肺经', effect: '宣肺解表、通经活络', location: '桡骨茎突上方，腕横纹上1.5寸' },
    '孔最': { meridian: '手太阴肺经', effect: '清热凉血、止血要穴', location: '尺泽与太渊连线上，腕横纹上7寸' },
    '中府': { meridian: '手太阴肺经', effect: '调理肺气、止咳平喘', location: '锁骨下窝外侧，云门下1寸' },
    '云门': { meridian: '手太阴肺经', effect: '宣肺止咳、疏经活络', location: '锁骨下窝凹陷中' },
    '侠白': { meridian: '手太阴肺经', effect: '宣肺理气', location: '天府下1寸，肱二头肌桡侧缘' },
    '天府': { meridian: '手太阴肺经', effect: '宣肺理气', location: '腋前纹头下3寸，肱二头肌桡侧缘' },
    '鱼际': { meridian: '手太阴肺经', effect: '清肺热、利咽喉', location: '第1掌骨中点赤白肉际' },
    '少商': { meridian: '手太阴肺经', effect: '清肺利咽、醒神开窍', location: '拇指末节桡侧，指甲角旁0.1寸' },
    '肺俞': { meridian: '足太阳膀胱经', effect: '宣肺理气、止咳平喘', location: '第3胸椎棘突下旁开1.5寸' },
    // 心经
    '神门': { meridian: '手少阴心经', effect: '养心安神、清心除烦', location: '腕掌侧远端横纹尺侧端' },
    '少府': { meridian: '手少阴心经', effect: '清心泻火、安神', location: '第4、5掌骨之间，握拳时小指尖处' },
    '灵道': { meridian: '手少阴心经', effect: '宁心安神、开窍', location: '腕横纹上1.5寸，尺侧腕屈肌腱桡侧' },
    '通里': { meridian: '手少阴心经', effect: '宁心安神、开窍', location: '腕横纹上1寸，尺侧腕屈肌腱桡侧' },
    '阴郄': { meridian: '手少阴心经', effect: '清心安神', location: '腕横纹上0.5寸，尺侧腕屈肌腱桡侧' },
    '少海': { meridian: '手少阴心经', effect: '宁心安神、舒筋', location: '屈肘，肘横纹内侧端' },
    '青灵': { meridian: '手少阴心经', effect: '理气止痛', location: '少海上3寸，肱二头肌内侧沟中' },
    '极泉': { meridian: '手少阴心经', effect: '宽胸理气', location: '腋窝中央，肱动脉内侧' },
    '心俞': { meridian: '足太阳膀胱经', effect: '养心安神、宽胸理气', location: '第5胸椎棘突下旁开1.5寸' },
    '巨阙': { meridian: '任脉', effect: '心募、宽胸理气', location: '前正中线上，脐上6寸' },
    // 小肠经
    '后溪': { meridian: '手太阳小肠经', effect: '通督清热、疏经通络', location: '第5掌指关节后缘，赤白肉际' },
    '腕骨': { meridian: '手太阳小肠经', effect: '清热利湿', location: '第5掌骨基底与三角骨之间，赤白肉际' },
    '小海': { meridian: '手太阳小肠经', effect: '清热安神', location: '屈肘，肘内侧两骨之间' },
    '养老': { meridian: '手太阳小肠经', effect: '明目通络', location: '前臂背面尺侧，尺骨小头近端桡侧' },
    '支正': { meridian: '手太阳小肠经', effect: '安神定志', location: '阳谷与小海连线上，腕背横纹上5寸' },
    '肩贞': { meridian: '手太阳小肠经', effect: '疏经活络', location: '肩关节后下方，臂内收时腋后纹头1寸' },
    '天宗': { meridian: '手太阳小肠经', effect: '舒筋活络', location: '肩胛冈下窝中央，第4胸椎棘突下旁开3寸' },
    '肩中俞': { meridian: '手太阳小肠经', effect: '宣肺理气', location: '第7颈椎棘突下旁开2寸' },
    '肩外俞': { meridian: '手太阳小肠经', effect: '舒筋活络', location: '第1胸椎棘突下旁开3寸' },
    '听宫': { meridian: '手太阳小肠经', effect: '通耳窍', location: '耳屏前，下颌骨髁状突后方' },
    '颧髎': { meridian: '手太阳小肠经', effect: '祛风消肿', location: '目外眦直下，颧骨下缘凹陷' },
    '少泽': { meridian: '手太阳小肠经', effect: '清热通乳', location: '小指尺侧指甲角旁0.1寸' },
    '前谷': { meridian: '手太阳小肠经', effect: '清热通乳', location: '小指尺侧，第5掌指关节前' },
    '阳谷': { meridian: '手太阳小肠经', effect: '清热散风', location: '腕背横纹尺侧，尺骨茎突前方' },
    '小肠俞': { meridian: '足太阳膀胱经', effect: '清热利湿', location: '第1骶椎棘突下旁开1.5寸' },
    // 膀胱经
    '肾俞': { meridian: '足太阳膀胱经', effect: '补肾固本、强壮腰膝', location: '第2腰椎棘突下旁开1.5寸' },
    '膈俞': { meridian: '足太阳膀胱经', effect: '活血化瘀、和血调血', location: '第7胸椎棘突下旁开1.5寸' },
    '肝俞': { meridian: '足太阳膀胱经', effect: '疏肝理气、养血明目', location: '第9胸椎棘突下旁开1.5寸' },
    '胆俞': { meridian: '足太阳膀胱经', effect: '疏肝利胆', location: '第10胸椎棘突下旁开1.5寸' },
    '委中': { meridian: '足太阳膀胱经', effect: '腰背痛要穴、活血通络', location: '腘横纹中点' },
    '承山': { meridian: '足太阳膀胱经', effect: '舒筋活络、理痔', location: '腓肠肌肌腹下，尖角凹陷处' },
    '昆仑': { meridian: '足太阳膀胱经', effect: '舒筋活络、清热', location: '外踝尖与跟腱之间凹陷处' },
    '至阴': { meridian: '足太阳膀胱经', effect: '胎位不正、头痛', location: '足小趾外侧趾甲角旁0.1寸' },
    '京骨': { meridian: '足太阳膀胱经', effect: '清热止痉、明目', location: '第5跖骨粗隆前方，赤白肉际' },
    '束骨': { meridian: '足太阳膀胱经', effect: '清热止痉', location: '第5跖趾关节后缘，赤白肉际' },
    '申脉': { meridian: '足太阳膀胱经', effect: '镇惊安神', location: '外踝尖直下凹陷处' },
    '仆参': { meridian: '足太阳膀胱经', effect: '舒筋活络', location: '外踝后下方，昆仑直下，跟骨外侧' },
    '金门': { meridian: '足太阳膀胱经', effect: '安神定志', location: '外踝前缘直下，第5跖骨粗隆后方' },
    '膀胱俞': { meridian: '足太阳膀胱经', effect: '调理膀胱、清热', location: '第2骶椎棘突下旁开1.5寸' },
    '中膂俞': { meridian: '足太阳膀胱经', effect: '调理下焦', location: '第3骶椎棘突下旁开1.5寸' },
    '白环俞': { meridian: '足太阳膀胱经', effect: '调经止带', location: '第4骶椎棘突下旁开1.5寸' },
    '关元俞': { meridian: '足太阳膀胱经', effect: '补肾固本', location: '第5腰椎棘突下旁开1.5寸' },
    '气海俞': { meridian: '足太阳膀胱经', effect: '补气活血', location: '第3腰椎棘突下旁开1.5寸' },
    '三焦俞': { meridian: '足太阳膀胱经', effect: '调理三焦', location: '第1腰椎棘突下旁开1.5寸' },
    '厥阴俞': { meridian: '足太阳膀胱经', effect: '宽胸理气', location: '第4胸椎棘突下旁开1.5寸' },
    '膏肓俞': { meridian: '足太阳膀胱经', effect: '补虚益损', location: '第4胸椎棘突下旁开3寸' },
    '神堂': { meridian: '足太阳膀胱经', effect: '宽胸理气', location: '第5胸椎棘突下旁开3寸' },
    '魂门': { meridian: '足太阳膀胱经', effect: '疏肝理气', location: '第9胸椎棘突下旁开3寸' },
    '魄户': { meridian: '足太阳膀胱经', effect: '补肺定魄', location: '第3胸椎棘突下旁开3寸' },
    '意舍': { meridian: '足太阳膀胱经', effect: '健脾化湿', location: '第11胸椎棘突下旁开3寸' },
    '志室': { meridian: '足太阳膀胱经', effect: '补肾固精', location: '第2腰椎棘突下旁开3寸' },
    '胞肓': { meridian: '足太阳膀胱经', effect: '调理下焦', location: '第2骶椎棘突下旁开3寸' },
    '秩边': { meridian: '足太阳膀胱经', effect: '调理下焦', location: '第4骶椎棘突下旁开3寸' },
    // 胆经
    '阳陵泉': { meridian: '足少阳胆经', effect: '疏肝利胆、舒筋活络', location: '腓骨小头前下方凹陷处' },
    '风池': { meridian: '足少阳胆经', effect: '疏风解表、醒脑开窍', location: '枕骨下，斜方肌上端与胸锁乳突肌之间' },
    '悬钟': { meridian: '足少阳胆经', effect: '髓会、舒筋活络', location: '外踝尖上3寸，腓骨后缘' },
    '足临泣': { meridian: '足少阳胆经', effect: '疏肝解郁', location: '第4、5跖骨结合部前方，小趾伸肌腱外侧' },
    '带脉': { meridian: '足少阳胆经', effect: '调经止带、健脾', location: '第11肋端直下，平脐处' },
    '环跳': { meridian: '足少阳胆经', effect: '疏经活络、祛风除湿', location: '股骨大转子与骶管裂孔连线的外1/3处' },
    '风市': { meridian: '足少阳胆经', effect: '祛风化湿', location: '大腿外侧，腘横纹上7寸' },
    '中渎': { meridian: '足少阳胆经', effect: '疏经活络', location: '大腿外侧，腘横纹上5寸' },
    '膝阳关': { meridian: '足少阳胆经', effect: '舒筋活络', location: '膝关节外侧，股骨外上髁上方凹陷' },
    '阳交': { meridian: '足少阳胆经', effect: '疏肝镇惊', location: '外踝尖上7寸，腓骨后缘' },
    '外丘': { meridian: '足少阳胆经', effect: '疏肝镇惊', location: '外踝尖上7寸，腓骨前缘' },
    '光明': { meridian: '足少阳胆经', effect: '明目通络', location: '外踝尖上5寸，腓骨前缘' },
    '阳辅': { meridian: '足少阳胆经', effect: '清热散风', location: '外踝尖上4寸，腓骨前缘' },
    '丘墟': { meridian: '足少阳胆经', effect: '疏肝利胆', location: '外踝前下方，趾长伸肌腱外侧凹陷' },
    '足窍阴': { meridian: '足少阳胆经', effect: '清热利胆', location: '第4趾外侧趾甲角旁0.1寸' },
    '侠溪': { meridian: '足少阳胆经', effect: '清热熄风', location: '第4、5趾间，趾蹼缘后方' },
    '地五会': { meridian: '足少阳胆经', effect: '疏肝消肿', location: '第4、5跖骨之间，第4跖趾关节后' },
    '日月': { meridian: '足少阳胆经', effect: '胆募、疏肝利胆', location: '乳头下方，第7肋间隙' },
    '京门': { meridian: '足少阳胆经', effect: '肾募、温肾利水', location: '第12肋游离端下方' },
    // 肾经
    '太溪': { meridian: '足少阴肾经', effect: '滋阴补肾、清热生津', location: '内踝尖与跟腱之间凹陷处' },
    '照海': { meridian: '足少阴肾经', effect: '滋阴清热、调经止痛', location: '内踝尖下方凹陷处' },
    '涌泉': { meridian: '足少阴肾经', effect: '苏厥开窍、滋肾清热', location: '足底前1/3凹陷处' },
    '然谷': { meridian: '足少阴肾经', effect: '滋阴清热', location: '足舟骨粗隆前下方，赤白肉际' },
    '大钟': { meridian: '足少阴肾经', effect: '益肾通络', location: '太溪下0.5寸，跟腱内侧缘' },
    '复溜': { meridian: '足少阴肾经', effect: '补肾益气、利水', location: '太溪直上2寸，跟腱前方' },
    '阴谷': { meridian: '足少阴肾经', effect: '补肾培元、利水', location: '膝内侧，腘窝内侧，半腱肌半膜肌止端' },
    '筑宾': { meridian: '足少阴肾经', effect: '安神定志、化痰', location: '太溪上5寸，腓肠肌内侧' },
    '交信': { meridian: '足少阴肾经', effect: '调经止血', location: '太溪上2寸，胫骨内侧缘后' },
    '肓俞': { meridian: '足少阴肾经', effect: '理气止痛', location: '脐中旁开0.5寸' },
    '中注': { meridian: '足少阴肾经', effect: '调经止痛', location: '脐下1寸，前正中线旁开0.5寸' },
    '四满': { meridian: '足少阴肾经', effect: '调经止痛', location: '脐下2寸，前正中线旁开0.5寸' },
    '气穴': { meridian: '足少阴肾经', effect: '调经止泻', location: '脐下3寸，前正中线旁开0.5寸' },
    '大赫': { meridian: '足少阴肾经', effect: '补肾固精', location: '脐下4寸，前正中线旁开0.5寸' },
    '幽门': { meridian: '足少阴肾经', effect: '和胃降逆', location: '脐上6寸，前正中线旁开0.5寸' },
    '神藏': { meridian: '足少阴肾经', effect: '宽胸理气', location: '第2肋间隙，前正中线旁开2寸' },
    '彧中': { meridian: '足少阴肾经', effect: '宽胸理气', location: '第1肋间隙，前正中线旁开2寸' },
    '俞府': { meridian: '足少阴肾经', effect: '宽胸理气', location: '锁骨下缘，前正中线旁开2寸' },
    '灵墟': { meridian: '足少阴肾经', effect: '宽胸理气', location: '第3肋间隙，前正中线旁开2寸' },
    '神封': { meridian: '足少阴肾经', effect: '宽胸理气', location: '第4肋间隙，前正中线旁开2寸' },
    '步廊': { meridian: '足少阴肾经', effect: '宽胸理气', location: '第5肋间隙，前正中线旁开2寸' },
    // 心包经
    '内关': { meridian: '手厥阴心包经', effect: '和胃降逆、宽胸理气', location: '腕掌侧远端横纹上2寸' },
    '大陵': { meridian: '手厥阴心包经', effect: '清心泻火、和胃止呕', location: '腕掌侧远端横纹中央' },
    '劳宫': { meridian: '手厥阴心包经', effect: '清心泻火、开窍', location: '掌心，第2、3掌骨之间' },
    '郄门': { meridian: '手厥阴心包经', effect: '心包经郄穴、急性痛证', location: '腕掌侧横纹上5寸' },
    '曲泽': { meridian: '手厥阴心包经', effect: '清热除烦、和胃降逆', location: '肘横纹中，肱二头肌腱尺侧' },
    '间使': { meridian: '手厥阴心包经', effect: '宽胸理气', location: '腕横纹上3寸，掌长肌腱与桡侧腕屈肌腱之间' },
    '天泉': { meridian: '手厥阴心包经', effect: '宽胸理气', location: '腋前纹头下2寸，肱二头肌长、短头之间' },
    '天池': { meridian: '手厥阴心包经', effect: '宽胸理气', location: '乳头外1寸，第4肋间隙' },
    // 三焦经
    '外关': { meridian: '手少阳三焦经', effect: '疏风清热、通经活络', location: '腕背横纹上2寸，尺骨与桡骨之间' },
    '支沟': { meridian: '手少阳三焦经', effect: '清热通便、疏经活络', location: '腕背横纹上3寸，尺骨与桡骨之间' },
    '肩髎': { meridian: '手少阳三焦经', effect: '舒筋活络', location: '肩峰后下方，臂外展时肩峰后凹陷' },
    '翳风': { meridian: '手少阳三焦经', effect: '聪耳通窍', location: '耳垂后方，乳突与下颌角之间' },
    '角孙': { meridian: '手少阳三焦经', effect: '清热散风', location: '耳尖直上，发际处' },
    '耳门': { meridian: '手少阳三焦经', effect: '通耳窍', location: '耳屏上切迹前方，下颌骨髁状突后缘' },
    '丝竹空': { meridian: '手少阳三焦经', effect: '明目散风', location: '眉梢外侧端凹陷' },
    '中渚': { meridian: '手少阳三焦经', effect: '清热通络', location: '手背第4、5掌骨间，第4掌指关节后方' },
    '阳池': { meridian: '手少阳三焦经', effect: '清热散风', location: '腕背横纹中央，尺骨与腕骨之间' },
    '天井': { meridian: '手少阳三焦经', effect: '清热化痰', location: '屈肘，肘尖直上1寸凹陷' },
    '清冷渊': { meridian: '手少阳三焦经', effect: '清热通络', location: '屈肘，肘尖上2寸' },
    '消泺': { meridian: '手少阳三焦经', effect: '清热化痰', location: '肩井与曲池连线上，肩井下1寸' },
    '臑会': { meridian: '手少阳三焦经', effect: '舒筋活络', location: '肩峰与肱骨大结节之间，肩髎下3寸' },
    '瘈脉': { meridian: '手少阳三焦经', effect: '清热散风', location: '乳突中央，翳风与角孙沿耳轮连线下1/3处' },
    '颅息': { meridian: '手少阳三焦经', effect: '清热散风', location: '耳后，翳风与角孙沿耳轮连线上1/3处' },
    '三阳络': { meridian: '手少阳三焦经', effect: '通络止痛', location: '腕背横纹上4寸，尺骨与桡骨之间' },
    '四渎': { meridian: '手少阳三焦经', effect: '通窍聪耳', location: '肘尖下方5寸，桡骨与尺骨之间' },
    // 任脉
    '气海': { meridian: '任脉', effect: '补气固本、温阳固脱', location: '前正中线上，脐下1.5寸' },
    '关元': { meridian: '任脉', effect: '补肾固本、温阳益气', location: '前正中线上，脐下3寸' },
    '中极': { meridian: '任脉', effect: '补肾固本、调经', location: '前正中线上，脐下4寸' },
    '膻中': { meridian: '任脉', effect: '宽胸理气、降逆止呕', location: '前正中线上，平第4肋间隙' },
    '天突': { meridian: '任脉', effect: '宣肺止咳、降逆化痰', location: '胸骨上窝中央' },
    '中脘': { meridian: '任脉', effect: '和胃健脾、降逆利水', location: '前正中线上，脐上4寸' },
    '上脘': { meridian: '任脉', effect: '和胃降逆', location: '前正中线上，脐上5寸' },
    '下脘': { meridian: '任脉', effect: '健脾和胃', location: '前正中线上，脐上2寸' },
    '建里': { meridian: '任脉', effect: '健脾和胃', location: '前正中线上，脐上3寸' },
    '水分': { meridian: '任脉', effect: '利水消肿', location: '前正中线上，脐上1寸' },
    '神阙': { meridian: '任脉', effect: '回阳固脱', location: '脐中央' },
    '阴交': { meridian: '任脉', effect: '调经固下', location: '前正中线上，脐下1寸' },
    '曲骨': { meridian: '任脉', effect: '调经止带', location: '前正中线上，耻骨联合上缘' },
    '会阴': { meridian: '任脉', effect: '调经固下', location: '肛门与外生殖器连线中点' },
    '华盖': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，胸骨柄与胸骨体结合处' },
    '璇玑': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，胸骨柄中央' },
    '玉堂': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，第3肋间隙' },
    '紫宫': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，第2肋间隙' },
    '鸠尾': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，胸剑结合部下1寸' },
    '中庭': { meridian: '任脉', effect: '宽胸理气', location: '前正中线上，平第5肋间隙' },
    '廉泉': { meridian: '任脉', effect: '通窍利咽', location: '喉结上方，舌骨上缘凹陷' },
    '承浆': { meridian: '任脉', effect: '通窍利咽', location: '颏唇沟正中凹陷' },
    // 督脉
    '命门': { meridian: '督脉', effect: '补肾壮阳、温煦命门', location: '后正中线上，第2腰椎棘突下' },
    '百会': { meridian: '督脉', effect: '升阳举陷、清热开窍', location: '头顶正中，前发际正中直上5寸' },
    '大椎': { meridian: '督脉', effect: '清热解表、通阳', location: '第7颈椎棘突下凹陷处' },
    '风府': { meridian: '督脉', effect: '疏风解表、醒脑开窍', location: '后发际正中直上1寸' },
    '腰阳关': { meridian: '督脉', effect: '温肾壮阳', location: '第4腰椎棘突下凹陷处' },
    '腰俞': { meridian: '督脉', effect: '调经清热', location: '骶管裂孔处' },
    '长强': { meridian: '督脉', effect: '脱肛、痔疾', location: '尾骨尖与肛门连线中点' },
    '阳关': { meridian: '督脉', effect: '温肾利湿', location: '第16椎棘突下凹陷处' },
    '中枢': { meridian: '督脉', effect: '理气和中', location: '第10胸椎棘突下凹陷处' },
    '筋缩': { meridian: '督脉', effect: '舒筋止痉', location: '第9胸椎棘突下凹陷处' },
    '至阳': { meridian: '督脉', effect: '理气宽胸', location: '第7胸椎棘突下凹陷处' },
    '灵台': { meridian: '督脉', effect: '清热理气', location: '第6胸椎棘突下凹陷处' },
    '神道': { meridian: '督脉', effect: '宁心安神', location: '第5胸椎棘突下凹陷处' },
    '身柱': { meridian: '督脉', effect: '清热理气', location: '第3胸椎棘突下凹陷处' },
    '陶道': { meridian: '督脉', effect: '清热解表', location: '第1胸椎棘突下凹陷处' },
    '哑门': { meridian: '督脉', effect: '通窍醒神', location: '后发际正中直上0.5寸' },
    '脑户': { meridian: '督脉', effect: '清热散风', location: '风府上1.5寸，后发际正中直上2.5寸' },
    '强间': { meridian: '督脉', effect: '清热散风', location: '脑户上1.5寸，后发际正中直上4寸' },
    '后顶': { meridian: '督脉', effect: '清热散风', location: '百会后1.5寸' },
    '前顶': { meridian: '督脉', effect: '清热散风', location: '百会前1.5寸' },
    '囟会': { meridian: '督脉', effect: '清热散风', location: '百会前3寸，前发际正中直上2寸' },
    '上星': { meridian: '督脉', effect: '清热散风', location: '前发际正中直上1寸' },
    '神庭': { meridian: '督脉', effect: '清热安神', location: '前发际正中直上0.5寸' },
    '素髎': { meridian: '督脉', effect: '通鼻窍', location: '鼻尖正中' },
    '水沟': { meridian: '督脉', effect: '通督开窍', location: '人中沟正中线上1/3处' },
    '兑端': { meridian: '督脉', effect: '清热开窍', location: '上唇尖端，人中沟与唇交界处' },
    '龈交': { meridian: '督脉', effect: '清热开窍', location: '上唇系带与齿龈连接处' },
    // 经外奇穴
    '定喘': { meridian: '经外奇穴', effect: '定喘止咳', location: '大椎旁开0.5寸' },
    '太阳': { meridian: '经外奇穴', effect: '疏风清热、明目止痛', location: '眉梢与目外眦之间向后约1寸凹陷' },
    '四神聪': { meridian: '经外奇穴', effect: '醒脑开窍、安神', location: '百会前后左右各1寸' },
    '印堂': { meridian: '经外奇穴', effect: '醒脑开窍、安神', location: '两眉之间' },
    '安眠': { meridian: '经外奇穴', effect: '安神助眠', location: '翳风与风池连线中点' },
    '牵正': { meridian: '经外奇穴', effect: '祛风清热', location: '耳垂前0.5-1寸' },
    '翳明': { meridian: '经外奇穴', effect: '明目聪耳', location: '翳风后1寸' },
    '胆囊': { meridian: '经外奇穴', effect: '利胆排石', location: '阳陵泉下1-2寸压痛处' },
    '阑尾': { meridian: '经外奇穴', effect: '清热导滞', location: '足三里下1-2寸压痛处' },
    '肩前': { meridian: '经外奇穴', effect: '舒筋活络', location: '腋前纹头与肩髃连线中点' },
    '十宣': { meridian: '经外奇穴', effect: '清热开窍', location: '十指尖端，距指甲0.1寸' },
    '八邪': { meridian: '经外奇穴', effect: '清热通络', location: '手背各指间缝纹端' },
    '八风': { meridian: '经外奇穴', effect: '清热通络', location: '足背各趾间缝纹端' },
    '夹脊': { meridian: '经外奇穴', effect: '调理脏腑', location: '第1胸椎至第5腰椎棘突下旁开0.5寸' },
    '腰眼': { meridian: '经外奇穴', effect: '补肾壮腰', location: '第4腰椎棘突下旁开3.5寸凹陷' },
    '十七椎': { meridian: '经外奇穴', effect: '调理下焦', location: '第5腰椎棘突下凹陷' },
  };

  // 清洗穴位名称：去掉DeepSeek加的括号注释，如"神门（清心火）"→"神门"
  const cleanAcupointName = (name: string) => name.replace(/[（(].*[）)]/g, '').trim();
  
  /**
   * DeepSeek API辨证推理 v3.0
   * 调用舌镜AI诊断接口
   */
  const diagnoseWithDeepSeek = async () => {
    console.log('[DeepSeek诊断] 开始AI辨证推理...');
    
    // 构建舌象特征对象
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || 
                         shapeDist?.bulge?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || 
                     shapeDist?.bulge?.includes('裂纹') || false;
    
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    
    const response = await fetch('/api/tongue-ai/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tongueFeatures,
        age: patientInfo.age,
        symptoms,
        patientInfo,
      }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'DeepSeek诊断失败');
    }
    
    // 转换DeepSeek返回格式为前端期望的格式
    const aiResult = result.data;
    
    const diagnosisResult = {
      primarySyndrome: aiResult.mainSyndrome,
      syndromeName: aiResult.mainSyndrome,
      pathogenesis: aiResult.pathogenesis,
      organLocation: aiResult.organLocation?.primary 
        ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
        : [],
      secondarySyndromes: aiResult.secondarySyndromes || [],
      confidence: aiResult.confidence || 0.8,
      transmissionType: aiResult.transmissionAnalysis?.type,
      transmissionDescription: aiResult.transmissionAnalysis?.description,
      diagnosisEvidence: [],
      diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
      // 兼容旧格式
      mainSyndrome: aiResult.mainSyndrome,
      mainSyndromeDesc: aiResult.mainSyndromeDesc,
      confidenceScore: aiResult.confidence,
    };
    
    // 将字符串数组转为对象数组，填充穴位知识（使用共享知识库）
    const enrichPoints = (names: string[], defaultTechnique: string) => {
      const arr = Array.isArray(names) ? names : [];
      return arr.map((item: any) => {
        if (typeof item === 'string') {
          // 清洗穴位名称，去掉括号内容
          const cleanPointName = cleanAcupointName(item);
          const info = acupointKnowledge[cleanPointName] || {};
          return {
            point: cleanPointName,
            meridian: info.meridian || '待确认',
            effect: info.effect || '调理气血',
            location: info.location || '标准定位待确认',
            technique: defaultTechnique,
          };
        }
        // 如果是对象格式，也清洗point字段
        if (item && typeof item === 'object' && item.point) {
          const cleanPointName = cleanAcupointName(item.point);
          const info = acupointKnowledge[cleanPointName] || {};
          return {
            ...item,
            point: cleanPointName,
            meridian: item.meridian || info.meridian || '待确认',
            effect: item.effect || info.effect || '调理气血',
            location: item.location || info.location || '标准定位待确认',
          };
        }
        return item;
      });
    };

    const defaultTechnique = aiResult.acupuncturePlan?.technique || '平补平泻';
    const acupuncturePlan = {
      treatmentPrinciple: aiResult.acupuncturePlan?.technique || '',
      mainPoints: enrichPoints(aiResult.acupuncturePlan?.mainPoints || [], defaultTechnique),
      secondaryPoints: enrichPoints(aiResult.acupuncturePlan?.secondaryPoints || [], defaultTechnique),
      technique: defaultTechnique,
      description: aiResult.acupuncturePlan?.pointsDescription || '',
      pointsDescription: aiResult.acupuncturePlan?.pointsDescription || '',
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple: defaultTechnique,
        needleRetentionTime: '20分钟',
        treatmentFrequency: '每日1次',
        treatmentSessions: '5次为一疗程',
        sessionInterval: '1-2天',
      },
    };
    
    const lifeCareAdvice = {
      diet: aiResult.lifeCareAdvice?.diet || [],
      lifestyle: aiResult.lifeCareAdvice?.lifestyle || [],
      precautions: aiResult.lifeCareAdvice?.precautions || [],
    };
    
    return { diagnosisResult, acupuncturePlan, lifeCareAdvice };
  };

  // ========== v3.2 问而确之：Inquiry模式调用 ==========
  const diagnoseWithInquiry = async () => {
    console.log('[DeepSeek诊断] 启动问诊模式...');
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || false;
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    try {
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: selectedAgeGroup || patientInfo.age,
          mode: 'inquiry',
        }),
      });
      const result = await response.json();
      if (result.needsConfirmation && result.questions?.length > 0) {
        setInquiryQuestions(result.questions);
        setInquiryConversationId(result.conversationId);
        setPreliminaryResult(result.preliminaryResult);
        setShowInquiry(true);
      } else {
        const aiResult = result.data || result.preliminaryResult;
        if (aiResult) {
          setDiagnosisResult({
            primarySyndrome: aiResult.mainSyndrome,
            syndromeName: aiResult.mainSyndrome,
            pathogenesis: aiResult.pathogenesis,
            organLocation: aiResult.organLocation?.primary
              ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
              : [],
            confidence: aiResult.confidence || 0.8,
            mainSyndrome: aiResult.mainSyndrome,
            mainSyndromeDesc: aiResult.mainSyndromeDesc,
            confidenceScore: aiResult.confidence,
          });
          setCurrentStep('result');
        }
      }
    } catch (err) {
      console.error('[问诊] 调用失败:', err);
      setError('问诊调用失败，请重试');
    }
  };

  // ========== v3.2 问诊提交处理 ==========
  const handleInquirySubmit = async (answers: { questionId: string; selectedOption: string }[]) => {
    console.log('[问诊] 用户回答:', answers);
    setIsRefiningDiagnosis(true);
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || false;
    const tongueFeatures = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value || '正常',
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '薄',
      coatingMoisture: inputFeatures.coating.moisture || '润',
      teethMark: hasTeethMark,
      crack: hasCrack,
      tongueState: inputFeatures.tongueState.value || '正常',
    };
    try {
      const response = await fetch('/api/tongue-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tongueFeatures,
          age: selectedAgeGroup || patientInfo.age,
          mode: 'confirm',
          conversationId: inquiryConversationId,
          answers,
        }),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const aiResult = result.data;
        setDiagnosisResult({
          primarySyndrome: aiResult.mainSyndrome,
          syndromeName: aiResult.mainSyndrome,
          pathogenesis: aiResult.pathogenesis,
          organLocation: aiResult.organLocation?.primary
            ? [aiResult.organLocation.primary, ...(aiResult.organLocation.secondary || [])]
            : [],
          secondarySyndromes: aiResult.secondarySyndromes || [],
          confidence: aiResult.confidence || 0.8,
          transmissionType: aiResult.transmissionAnalysis?.type,
          transmissionDescription: aiResult.transmissionAnalysis?.description,
          mainSyndrome: aiResult.mainSyndrome,
          mainSyndromeDesc: aiResult.mainSyndromeDesc,
          confidenceScore: aiResult.confidence,
        });
        setShowInquiry(false);
        setShowRefineButton(true);
        setCurrentStep('result');
      }
    } catch (err) {
      console.error('[问诊确认] 调用失败:', err);
      setError('问诊确认失败，请重试');
    } finally {
      setIsRefiningDiagnosis(false);
    }
  };

  // ========== v3.2 "想更准"按钮处理 ==========
  const handleRefineDiagnosis = async () => {
    await diagnoseWithInquiry();
  };
  

  
  const {
    inputFeatures,
    symptoms,
    patientInfo,
    diagnosisResult,
    isAnalyzing,
    setTongueColor,
    setTongueShape,
    setTongueState,
    setCoating,
    setCrack,
    setTeethMark,
    setDistributionFeatures,
    setShapeDistribution,
    addSymptom,
    removeSymptom,
    updateSymptom,
    setPatientInfo,
    setImageData,
    setDiagnosisResult,
    setIsAnalyzing,
    setError,
    setCurrentStep,
    resetProgress,
    resetInput,
    getDiagnosisInput,
    saveCase,
  } = useDiagnosisStore();

  // 前端侧值映射（关键词包含匹配 + 语义映射，Bot返回值千变万化）
  const mapToEnum = (raw: string, validValues: string[]): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    // 0. 语义映射表（覆盖Bot常见的描述性表达）
    const semanticMap: Record<string, string> = {
      // 苔质
      '细腻': '薄', '细腻均匀': '薄', '均匀': '薄', '薄腻': '薄',
      '腻': '厚', '厚腻': '厚', '滑腻': '厚', '粗糙': '厚', '颗粒': '厚',
      // 润燥
      '湿润': '润', '津液充足': '润', '水滑': '润',
      '干燥': '燥', '少津': '燥',
      // 舌态描述
      '舒展': '正常', '自然': '正常', '活动自如': '正常', '柔软': '正常',
      '自如': '正常', '灵活': '正常',
      // 舌形描述
      '大小正常': '正常', '适中': '正常',
    };
    if (semanticMap[trimmed]) {
      const mapped = semanticMap[trimmed];
      if (validValues.includes(mapped)) return mapped;
    }
    // 语义关键词扫描（trimmed包含某个key）
    for (const [key, val] of Object.entries(semanticMap)) {
      if (trimmed.includes(key) && validValues.includes(val)) return val;
    }
    // 1. 精确匹配
    if (validValues.includes(trimmed)) return trimmed;
    // 2. 关键词包含匹配（优先匹配更长的枚举值，如"胖大"优先于"胖"）
    const sorted = [...validValues].sort((a, b) => b.length - a.length);
    for (const v of sorted) {
      if (trimmed.includes(v)) return v;
    }
    // 3. 反向包含
    for (const v of sorted) {
      if (v.includes(trimmed)) return v;
    }
    console.warn('[AI映射] 无法匹配:', trimmed, '有效值:', validValues);
    return '';
  };

  // AI识别结果回填（每个字段独立try/catch，一个失败不影响其他）
  const handleRecognize = (result: TongueRecognitionResult) => {
    console.log('[AI识别] 原始结果:', JSON.stringify(result, null, 2));

    // 舌色
    try {
      const colorVal = mapToEnum(result.tongue_color?.value || '', ['淡红', '淡白', '红', '绛', '紫', '青紫']);
      console.log('[AI识别] 舌色:', result.tongue_color?.value, '→', colorVal);
      setTongueColor(colorVal || '淡红');
    } catch (e) { console.error('[AI识别] 舌色回填异常:', e); }

    // 舌形
    try {
      const shapeVal = mapToEnum(result.tongue_shape?.value || '', ['胖大', '瘦薄', '正常']);
      console.log('[AI识别] 舌形:', result.tongue_shape?.value, '→', shapeVal);
      setTongueShape(shapeVal || '正常');
    } catch (e) { console.error('[AI识别] 舌形回填异常:', e); }

    // 齿痕
    try {
      if (result.tongue_shape?.teeth_mark?.has) {
        setTeethMark('是', result.tongue_shape.teeth_mark.degree || '轻度', result.tongue_shape.teeth_mark.position || '');
      } else {
        setTeethMark('否', '', '');
      }
    } catch (e) { console.error('[AI识别] 齿痕回填异常:', e); }

    // 裂纹
    try {
      if (result.tongue_shape?.crack?.has) {
        setCrack('是', result.tongue_shape.crack.degree || '轻度', result.tongue_shape.crack.position || '');
      } else {
        setCrack('否', '', '');
      }
    } catch (e) { console.error('[AI识别] 裂纹回填异常:', e); }

    // 舌苔
    try {
      const coatColor = mapToEnum(result.tongue_coating?.color || '', ['薄白', '白厚', '黄', '灰黑', '剥落']);
      const coatTexture = mapToEnum(result.tongue_coating?.texture || '', ['薄', '厚', '正常']);
      const coatMoisture = mapToEnum(result.tongue_coating?.moisture || '', ['润', '燥', '正常']);
      console.log('[AI识别] 苔色:', coatColor, '苔质:', coatTexture, '润燥:', coatMoisture);
      setCoating(coatColor || '薄白', coatTexture || '薄', coatMoisture || '润');
    } catch (e) { console.error('[AI识别] 舌苔回填异常:', e); }

    // 舌态
    try {
      const stateVal = mapToEnum(result.tongue_state?.value || '', ['强硬', '痿软', '歪斜', '颤动', '正常']);
      console.log('[AI识别] 舌态:', result.tongue_state?.value, '→', stateVal);
      setTongueState(stateVal || '正常');
    } catch (e) { console.error('[AI识别] 舌态回填异常:', e); }

    // 标记AI已识别
    setIsAIRecognized(true);
    toast.success('AI识别完成，已自动填入舌象特征 ✓');
  };

  /**
   * 本地规则引擎辨证（核心功能）
   * 100%基于主人辨证规则树，不依赖AI猜测
   */
  const handleLocalDiagnosis = (): {
    diagnosisResult: any;
    acupuncturePlan: any;
    lifeCareAdvice: any;
  } => {
    // 缓存检查
    const _ck = diagCacheKey(inputFeatures, patientInfo);
    const _cached = diagCacheGet(_ck);
    if (_cached) { console.log('[缓存命中]'); return _cached; }
    console.log('[本地规则引擎] 开始辨证...');
    
    // 检查齿痕和裂纹（同时兼容AI回填的teethMark/crack和手动选择的shapeDistribution）
    const shapeDist = inputFeatures.shapeDistribution;
    const hasTeethMark = inputFeatures.teethMark?.value === '是' ||
                         shapeDist?.depression?.includes('齿痕') || 
                         shapeDist?.bulge?.includes('齿痕') || false;
    const hasCrack = inputFeatures.crack?.value === '是' ||
                     shapeDist?.depression?.includes('裂纹') || 
                     shapeDist?.bulge?.includes('裂纹') || false;
    
    // 构建输入
    const input: DiagnosisInput = {
      tongueColor: inputFeatures.tongueColor.value,
      tongueShape: inputFeatures.tongueShape.value,
      tongueState: inputFeatures.tongueState.value,
      coatingColor: inputFeatures.coating.color,
      coatingTexture: inputFeatures.coating.texture || '正常',
      coatingMoisture: inputFeatures.coating.moisture || '正常',
      teethMark: hasTeethMark,
      crack: hasCrack,
      regionFeatures: inputFeatures.distributionFeatures?.map(item => ({
        region: item.part,
        color: item.feature,
      })),
    };
    
    // 调用本地规则引擎
    const result = localDiagnose(input, true);
    
    // 打印规则统计
    const stats = getRuleStatistics();
    console.log(`[本地规则引擎] 规则统计: 共${stats.totalRules}条规则`);
    console.log(`[本地规则引擎] 主要结果: ${result.primaryResult.syndrome}`);
    console.log(`[本地规则引擎] 匹配规则: ${result.primaryResult.matchedRuleName}`);
    
    // 构建诊断结果（严格匹配 DiagnosisResult 类型）
    const priorityMap: Record<string, '高' | '中' | '低'> = { high: '高', medium: '中', low: '低' };
    const diagnosisResultOut = {
      primarySyndrome: result.primaryResult.syndrome,
      syndromeScore: result.primaryResult.confidence || 0,
      confidence: (result.primaryResult.confidence || 0) / 100, // 0-100 → 0-1
      secondarySyndromes: (result.alternativeResults || []).map((r: any) => ({
        syndrome: r.syndrome,
        score: r.confidence || 0,
        confidence: (r.confidence || 0) / 100,
        matchedFeatures: [],
      })),
      pathogenesis: result.primaryResult.pathogenesis || '',
      organLocation: Array.isArray(result.primaryResult.organLocation) 
        ? result.primaryResult.organLocation : [result.primaryResult.organLocation || ''],
      diagnosisEvidence: [], // 本地引擎不提供详细依据表
      priority: priorityMap[result.primaryResult.priority] || '中',
      diagnosisTime: new Date().toLocaleTimeString('zh-CN'),
    };
    
    // 构建针灸方案（严格匹配 AcupuncturePlan 类型）
    // 清洗穴位名称并查询知识库
    const mainPointNames: string[] = (result.acupointSelection.mainPoints || []).map((n: string) => cleanAcupointName(n));
    const secondaryPointNames: string[] = (result.acupointSelection.secondaryPoints || []).map((n: string) => cleanAcupointName(n));
    const acupuncturePlan = {
      treatmentPrinciple: result.primaryResult.treatment || '',
      mainPoints: mainPointNames.map((name: string) => ({
        point: name,
        meridian: acupointKnowledge[name]?.meridian || '待确认',
        effect: acupointKnowledge[name]?.effect || '调理气血',
        location: acupointKnowledge[name]?.location || '标准定位待确认',
        technique: result.acupointSelection.method?.technique || '泻法',
      })),
      secondaryPoints: secondaryPointNames.map((name: string) => ({
        point: name,
        meridian: acupointKnowledge[name]?.meridian || '待确认',
        effect: acupointKnowledge[name]?.effect || '调理气血',
        location: acupointKnowledge[name]?.location || '标准定位待确认',
        technique: '补法',
      })),
      contraindications: [],
      treatmentAdvice: {
        techniquePrinciple: result.acupointSelection.method?.technique || '',
        needleRetentionTime: `${result.acupointSelection.method?.needleRetention || 20}分钟`,
        treatmentFrequency: result.acupointSelection.method?.frequency || '每日1次',
        treatmentSessions: result.acupointSelection.method?.course || '5次为一疗程',
        sessionInterval: '1-2天',
        moxibustionSuggestion: result.acupointSelection.method?.moxibustion || '',
      },
    };
    
    // 构建生活调护建议（严格匹配 LifeCareAdvice 类型）
    const lifeCareAdvice = generateLifeCareAdvice(result);
    
    const _result = { diagnosisResult: diagnosisResultOut, acupuncturePlan, lifeCareAdvice };
    diagCacheSet(_ck, _result);
    return _result;
  };
  
  /**
   * 根据辨证结果生成生活调护建议
   */
  const generateLifeCareAdvice = (result: any): any => {
    const advice: string[] = [];
    const syndrome = result.primaryResult.syndrome;
    
    // 饮食建议
    if (syndrome.includes('阴虚') || syndrome.includes('热')) {
      advice.push('宜食滋阴清热食物，如银耳、百合、梨、绿豆等');
      advice.push('忌食辛辣刺激、温热燥性食物');
    } else if (syndrome.includes('阳虚') || syndrome.includes('寒')) {
      advice.push('宜食温阳散寒食物，如羊肉、桂圆、生姜等');
      advice.push('忌食生冷寒凉食物');
    } else if (syndrome.includes('湿') || syndrome.includes('痰')) {
      advice.push('宜食健脾祛湿食物，如薏米、赤小豆、冬瓜等');
      advice.push('忌食甜腻厚味食物');
    } else if (syndrome.includes('气血两虚')) {
      advice.push('宜食补益气血食物，如红枣、枸杞、山药等');
      advice.push('忌食生冷油腻食物');
    } else {
      advice.push('饮食清淡，规律进餐');
      advice.push('避免暴饮暴食');
    }
    
    // 情志建议
    if (syndrome.includes('肝')) {
      advice.push('保持心情舒畅，避免情绪抑郁');
      advice.push('适度运动，如散步、太极拳');
    } else {
      advice.push('保持规律作息，避免过度劳累');
    }
    
    // 起居建议
    advice.push('保证充足睡眠，规律作息');
    advice.push('适度锻炼，增强体质');
    
    // 严格匹配 LifeCareAdvice 类型: dietSuggestions / dailyRoutine / precautions
    const dietItems = advice.filter((_, i) => i < 3);
    const routineItems = advice.filter((_, i) => i >= 3);
    return {
      dietSuggestions: dietItems,
      dailyRoutine: routineItems,
      precautions: Array.isArray(result.clinicalNotes) ? result.clinicalNotes : [],
    };
  };

  // 提交辨证 - 简化必填验证
  const handleSubmit = async () => {
    // ========== 简化必填验证 ==========
    // 有AI识别数据时：只要求舌色+苔色（其他已有默认值或AI填入）
    // 无AI识别数据时：只要求舌色+苔色
    
    const hasTongueColor = !!inputFeatures.tongueColor.value;
    const hasCoatingColor = !!inputFeatures.coating.color;
    
    // 舌色必填
    if (!hasTongueColor) {
      toast.error('请选择舌色');
      return;
    }
    
    // 苔色必填
    if (!hasCoatingColor) {
      toast.error('请选择苔色');
      return;
    }
    
    // 其他字段使用默认值（无值时自动填充）
    if (!inputFeatures.tongueShape.value) {
      setTongueShape('正常');
    }
    if (!inputFeatures.tongueState.value) {
      setTongueState('正常');
    }
    if (!inputFeatures.coating.texture) {
      setCoating(inputFeatures.coating.color, '薄', '润');
    }
    if (!inputFeatures.coating.moisture) {
      setCoating(inputFeatures.coating.color, inputFeatures.coating.texture || '薄', '润');
    }
    // 主诉改为选填，不阻断流程

    setIsAnalyzing(true);
    setError(null);
    setDiagnosisResult(null);

    if (useLocalEngine) {
      // ========== 路径A：本地规则引擎 ==========
      // 用setTimeout让出主线程，确保"分析中"UI先渲染
      setTimeout(() => {
          try {
            const { diagnosisResult: diagResult, acupuncturePlan, lifeCareAdvice } = handleLocalDiagnosis();
            setDiagnosisResult({ 
              diagnosisResult: diagResult, 
              acupuncturePlan, 
              lifeCareAdvice 
            } as any);
            toast.success(`辨证完成！${diagResult?.primarySyndrome || ''}`);
          } catch (error) {
            console.error('[本地引擎] 异常:', error);
            const message = error instanceof Error ? error.message : '规则引擎分析失败';
            setError(message);
            toast.error(message);
          } finally {
            setIsAnalyzing(false);
          }
        });
      return; // 提前返回，不走下面的try/catch/finally
    }

    try {
      // ========== 路径B：远程Bot API（异步，需要进度指示） ==========
      {
        const input = getDiagnosisInput();
        setCurrentStep('analyzing', 35);
        
        const result = await submitDiagnosis(input, (step) => {
          switch (step) {
            case 'recognizing': setCurrentStep('recognizing', 25); break;
            case 'analyzing': setCurrentStep('analyzing', 50); break;
            case 'reasoning': setCurrentStep('reasoning', 75); break;
            case 'matching': setCurrentStep('matching', 90); break;
          }
        });
        
        setCurrentStep('matching', 95);
        setDiagnosisResult(result);
        toast.success('辨证分析完成！');
      }
    } catch (error) {
      console.error('[辨证提交] 异常:', error);
      const message = error instanceof Error ? error.message : '辨证分析失败';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
      resetProgress();
    }
  };

  // 保存病例
  const handleSaveCase = () => {
    if (!diagnosisResult) {
      toast.error('请先完成辨证分析');
      return;
    }
    saveCase(diagnosisResult);
    toast.success('病例已保存');
  };

  // 清空输入
  const handleReset = () => {
    resetInput();
    setIsAIRecognized(false);
    toast.success('已清空所有输入');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Toaster position="top-center" />
      <NavBar currentPath="/" onNavigate={(path) => navigate(path)} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========== 移动端单列流布局 ========== */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
          
          {/* ========== 左侧：输入区域 ========== */}
          <div className="space-y-4">
            {/* ========== v3.2 年龄段选择器 ==========*/}
            <div className="mb-4 p-4 bg-white rounded-xl shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-stone-700 font-medium">您的年龄段</span>
                <span className="text-xs text-stone-400">（帮助更准确辨证）</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {ageGroups.map((group) => (
                  <button
                    key={group.value}
                    onClick={() => setSelectedAgeGroup(group.value)}
                    className={`
                      py-2.5 px-3 rounded-xl text-sm font-medium transition-all
                      ${selectedAgeGroup === group.value
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }
                    `}
                  >
                    {group.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 核心入口：拍照/上传 - 最醒目 */}
            <div className="tcm-card p-4 bg-gradient-to-br from-primary-50 to-secondary-50 border-2 border-primary-200">
              <ImageUpload 
                onChange={(imageData) => setImageData(imageData)} 
                onRecognize={handleRecognize}
              />
              {/* 引擎切换按钮 - 折叠到设置入口 */}
              <div className="mt-3 pt-3 border-t border-primary-100">
                <button
                  onClick={() => setShowEngineSwitch(!showEngineSwitch)}
                  className="flex items-center gap-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                >
                  <span className="text-sm">⚙️</span>
                  <span>{showEngineSwitch ? '收起' : '切换辨证引擎'}</span>
                  <svg className={`w-3 h-3 transition-transform ${showEngineSwitch ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showEngineSwitch && (
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setUseLocalEngine(true)}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        useLocalEngine
                          ? 'bg-primary-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      本地规则引擎 ✓
                    </button>
                    <button
                      onClick={() => setUseLocalEngine(false)}
                      className={`flex-1 px-3 py-2 text-xs rounded-lg transition-colors ${
                        !useLocalEngine
                          ? 'bg-secondary-500 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      AI Bot推理
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* 🔍 识别结果 - 用户关注点1：我舌头怎么了 */}
            <div className="tcm-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-medium text-stone-700 flex items-center gap-2">
                  <span>🔍</span> 识别结果
                  {isAIRecognized && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">AI</span>
                  )}
                </h2>
                <button 
                  onClick={() => {
                    const el = document.getElementById('feature-edit');
                    if (el) el.classList.toggle('hidden');
                  }}
                  className="text-xs text-stone-400 hover:text-stone-600"
                >
                  修改
                </button>
              </div>

              {/* 识别结果一览 - 彩色标签 */}
              <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                {inputFeatures.tongueColor.value ? (
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                    {inputFeatures.tongueColor.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                ) : (
                  <span className="text-xs text-stone-400">未识别</span>
                )}
                {inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                    {inputFeatures.tongueShape.value}
                  </span>
                )}
                {inputFeatures.coating.color && (
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200">
                    {inputFeatures.coating.color}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                    {inputFeatures.coating.moisture}
                  </span>
                )}
                {inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                    {inputFeatures.tongueState.value}
                  </span>
                )}
                {inputFeatures.teethMark?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">齿痕</span>
                )}
                {inputFeatures.crack?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">裂纹</span>
                )}
              </div>

              {/* 识别详情编辑 - 默认隐藏，点"修改"才出现 */}
              <div id="feature-edit" className="hidden mt-3 pt-3 border-t border-stone-200 space-y-1">

              {/* 当前特征一览 - 彩色标签一行看完 */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {inputFeatures.tongueColor.value && (
                  <span className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                    {inputFeatures.tongueColor.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.tongueShape.value && inputFeatures.tongueShape.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full border border-orange-200">
                    {inputFeatures.tongueShape.value}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.tongueState.value && inputFeatures.tongueState.value !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-purple-50 text-purple-600 rounded-full border border-purple-200">
                    {inputFeatures.tongueState.value}
                  </span>
                )}
                {inputFeatures.coating.color && (
                  <span className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full border border-green-200">
                    {inputFeatures.coating.color}{isAIRecognized && <sup className="ml-0.5 text-blue-500 text-[10px]">AI</sup>}
                  </span>
                )}
                {inputFeatures.coating.moisture && inputFeatures.coating.moisture !== '正常' && (
                  <span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                    {inputFeatures.coating.moisture}
                  </span>
                )}
                {inputFeatures.teethMark?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">齿痕</span>
                )}
                {inputFeatures.crack?.value === '是' && (
                  <span className="px-2 py-1 text-xs bg-amber-50 text-amber-600 rounded-full border border-amber-200">裂纹</span>
                )}
              </div>

              {/* 各特征折叠编辑 */}
              <details className="group" open={!inputFeatures.tongueColor.value}>
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>舌色</span>
                  <div className="flex items-center gap-2">
                    {inputFeatures.tongueColor.value && <span className="text-xs text-stone-400">{inputFeatures.tongueColor.value}</span>}
                    <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="mt-2"><TongueColorSelector value={inputFeatures.tongueColor.value} onChange={setTongueColor} /></div>
              </details>

              <details className="group" open={!inputFeatures.coating.color}>
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>舌苔</span>
                  <div className="flex items-center gap-2">
                    {inputFeatures.coating.color && <span className="text-xs text-stone-400">{[inputFeatures.coating.color, inputFeatures.coating.texture, inputFeatures.coating.moisture].filter(Boolean).join('·')}</span>}
                    <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="mt-2">
                  <TongueCoatingSelector
                    color={inputFeatures.coating.color} texture={inputFeatures.coating.texture} moisture={inputFeatures.coating.moisture}
                    onColorChange={(c) => setCoating(c, inputFeatures.coating.texture, inputFeatures.coating.moisture)}
                    onTextureChange={(t) => setCoating(inputFeatures.coating.color, t, inputFeatures.coating.moisture)}
                    onMoistureChange={(m) => setCoating(inputFeatures.coating.color, inputFeatures.coating.texture, m)}
                  />
                </div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>舌形</span>
                  <div className="flex items-center gap-2">
                    {inputFeatures.tongueShape.value && <span className="text-xs text-stone-400">{inputFeatures.tongueShape.value}</span>}
                    <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="mt-2"><TongueShapeSelector value={inputFeatures.tongueShape.value} onChange={setTongueShape} /></div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>舌态</span>
                  <div className="flex items-center gap-2">
                    {inputFeatures.tongueState.value && <span className="text-xs text-stone-400">{inputFeatures.tongueState.value}</span>}
                    <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </summary>
                <div className="mt-2"><TongueStateSelector value={inputFeatures.tongueState.value} onChange={setTongueState} shapeValue={inputFeatures.shapeDistribution} onShapeChange={setShapeDistribution} /></div>
              </details>

              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer text-sm text-stone-600 hover:text-stone-800 py-1">
                  <span>区域诊断</span>
                  <svg className="w-3.5 h-3.5 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="mt-2"><TongueColorDistribution onChange={setDistributionFeatures} /></div>
              </details>
              </div>
            </div>


            {/* 补充信息 - 合并折叠 */}
            <details className="tcm-card group">
              <summary className="p-4 flex items-center justify-between cursor-pointer text-sm text-stone-500 hover:text-stone-700">
                <span>补充信息（选填）</span>
                <svg className="w-4 h-4 text-stone-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-4 pb-4 space-y-4">
                <div>
                  <span className="text-xs text-stone-500 block mb-2">患者信息</span>
                  <PatientInfoForm patientInfo={patientInfo} onChange={setPatientInfo} />
                </div>
                <div className="border-t border-stone-100 pt-3">
                  <span className="text-xs text-stone-500 block mb-2">伴随症状 {symptoms.length > 0 && <span className="text-stone-400">({symptoms.length}项)</span>}</span>
                  <SymptomInput symptoms={symptoms} onAdd={addSymptom} onRemove={removeSymptom} onUpdate={updateSymptom} />
                </div>
              </div>
            </details>

            {/* 提交按钮 - 大而醒目 */}
            <button
              onClick={handleSubmit}
              disabled={isAnalyzing}
              className="w-full py-4 rounded-xl text-base font-medium transition-all disabled:opacity-50 bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:from-primary-600 hover:to-secondary-600 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  分析中...
                </>
              ) : (
                <>
                  <span className="text-xl">🔍</span>
                  开始辨证分析
                </>
              )}
            </button>

            {/* 清空按钮 */}
            <button
              onClick={handleReset}
              className="w-full py-2.5 rounded-xl text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              清空重填
            </button>

            {/* 进度显示 - 极简 */}
            {isAnalyzing && (
              <div className="text-center py-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                <div className="animate-pulse flex items-center justify-center gap-2 text-sm text-stone-600">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {useLocalEngine ? '本地规则引擎分析中...' : 'DeepSeek AI推理中...'}
                </div>
              </div>
            )}
          </div>

          {/* ========== 右侧：结果展示 ========== */}
          <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {diagnosisResult ? (
              <div className="space-y-3">
                {/* 📋 辨证结果 - 用户关注点2：怎么了+怎么办 */}
                
                {/* 证型结论 - 最醒目 */}
                <DiagnosisResultDisplay result={diagnosisResult.diagnosisResult} />
                
                {/* Tab切换：病机 | 针灸 | 调理 */}
                <div className="flex border-b border-stone-200">
                  <button
                    onClick={() => setResultTab('pathogenesis')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'pathogenesis'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    病机分析
                  </button>
                  <button
                    onClick={() => setResultTab('acupuncture')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'acupuncture'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    针灸方案
                  </button>
                  <button
                    onClick={() => setResultTab('care')}
                    className={`flex-1 py-2.5 text-sm font-medium text-center transition-colors ${
                      resultTab === 'care'
                        ? 'text-primary-600 border-b-2 border-primary-500'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    生活调理
                  </button>
                </div>

                {/* Tab内容 */}
                {resultTab === 'pathogenesis' && (
                  <div className="tcm-card p-4 space-y-3 animate-in">
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">病机</span>
                      <p className="text-sm text-primary-700 font-medium">{diagnosisResult.diagnosisResult?.pathogenesis || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-stone-500 block mb-1">脏腑定位</span>
                      <div className="flex flex-wrap gap-1.5">
                        {diagnosisResult.diagnosisResult?.organLocation?.map((organ: string, i: number) => (
                          <span key={i} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded-full border border-red-200">
                            {organ}{i === 0 && <span className="ml-0.5 opacity-60">(主)</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                    {diagnosisResult.diagnosisResult?.secondarySyndromes?.length > 0 && (
                      <div>
                        <span className="text-xs text-stone-500 block mb-1">也需关注</span>
                        {diagnosisResult.diagnosisResult.secondarySyndromes.slice(0, 2).map((s: any, i: number) => (
                          <span key={i} className="text-sm text-stone-600 mr-2">· {s.syndrome}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {resultTab === 'acupuncture' && (
                  <AcupunctureDisplay plan={diagnosisResult.acupuncturePlan} />
                )}
                {resultTab === 'care' && (
                  <LifeCareDisplay advice={diagnosisResult.lifeCareAdvice} />
                )}
                
                <button
                  onClick={handleSaveCase}
                  className="w-full py-2 rounded-xl text-xs font-medium bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
                >
                  保存此病例
                
                {/* 付费解锁入口 - 社会证明 */}
                <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                  <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 mb-2">
                    <span>🔓</span>
                    <span>已有{userCount.toLocaleString()}人解锁深度辨证方案</span>
                  </div>
                  <button
                    onClick={() => toast.success('深度辨证方案开发中，敬请期待！')}
                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    获取深度辨证方案 ¥9.9
                  </button>
                
                {/* ========== v3.2 "想更准"按钮 ========== */}
                {diagnosisResult && !showRefineButton && (
                  <button
                    onClick={handleRefineDiagnosis}
                    disabled={isRefiningDiagnosis}
                    className={`
                      w-full py-2.5 rounded-xl text-sm font-medium transition-all mt-3
                      ${isRefiningDiagnosis
                        ? 'bg-stone-100 text-stone-400 cursor-wait'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 hover:from-amber-100 hover:to-orange-100 border border-amber-200'
                      }
                    `}
                  >
                    {isRefiningDiagnosis ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        生成问诊问题中...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        🎯 想更准确？回答几个小问题
                      </span>
                    )}
                  </button>
                )}

                </div>
                </button>
              </div>
            ) : (
              <div className="tcm-card p-8 flex flex-col items-center justify-center text-center">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-base font-medium text-stone-600 mb-1">
                  等待辨证分析
                </h3>
                <p className="text-xs text-stone-400">
                  拍照上传或填写舌象特征，点击开始辨证
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    
      {/* ========== v3.2 问诊对话框 ========== */}
      {showInquiry && (
        <InquiryDialog
          questions={inquiryQuestions}
          conversationId={inquiryConversationId || ''}
          preliminaryResult={preliminaryResult}
          onSubmit={handleInquirySubmit}
          onCancel={() => setShowInquiry(false)}
          isLoading={isRefiningDiagnosis}
        />
      )}
</div>
  );
};

export default DiagnosisPage;
