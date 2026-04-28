/**
 * 正和系统对接服务导出
 */

export {
  zhengheClient,
  TONGUE_DIAGNOSIS_SERVICE,
  ERROR_CODE_MESSAGES,
} from './zhenghe';

export type {
  AccountInfo,
  PoolPrice,
  ServiceOrder,
  ReferralInfo,
  TongueDiagnosisMetadata,
  ZhengheError,
  ZhengheResponse,
} from './zhenghe';

export {
  diagnosisCreditService,
  formatOrderStatus,
  calculateExpectedReward,
} from './diagnosisCredit';

export type { DiagnosisSession, DiagnosisWithCreditsParams } from './diagnosisCredit';
