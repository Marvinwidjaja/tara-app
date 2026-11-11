/**
 * Words on the caregiver's screens, in each caregiver language. (Plan wording that the backend
 * also uses, like "Safety" or "Earlier today", comes from shared/messages.ts.)
 */
import { fill } from '@/shared/messages';
import type { Language, Localized } from '@/shared/types';

const L = (en: string, es: string, zh: string, tl: string): Localized => ({ en, es, zh, tl });

export const CT = {
  tabToday: L('Today', 'Hoy', '今天', 'Ngayon'),
  tabMessages: L('Messages', 'Mensajes', '消息', 'Mensahe'),
  tabMe: L('Me', 'Yo', '我', 'Ako'),

  hi: L('Hi {name}', 'Hola {name}', '{name}您好', 'Hi {name}'),
  months: L('{n} MONTHS', '{n} MESES', '{n}个月', '{n} BUWAN'),
  todaySubtitle: L(
    'Your activities with {child}, planned by {parent}.',
    'Tus actividades con {child}, planeadas por {parent}.',
    '{parent}为您和{child}安排的活动。',
    'Mga aktibidad ninyo ni {child}, plinano ni {parent}.'
  ),
  nothingPlanned: L(
    'Nothing planned for this day. Enjoy your time with {child}!',
    'No hay nada planeado para este día. ¡Disfruta con {child}!',
    '这天没有安排活动。祝您和{child}玩得开心！',
    'Walang nakaplano sa araw na ito. Mag-enjoy kayo ni {child}!'
  ),
  minutes: L('{n} min', '{n} min', '{n}分钟', '{n} min'),

  statusTodo: L('To do', 'Pendiente', '待完成', 'Gagawin'),
  statusDone: L('Done', 'Hecho', '完成', 'Tapos'),
  statusChanged: L('Done differently', 'Hecho a su manera', '换了方式完成', 'Iba ang ginawa'),
  statusSkipped: L('Skipped', 'Saltado', '跳过', 'Nilaktawan'),
  statusVoice: L('Voice note', 'Audio', '语音', 'Voice note'),

  markDone: L('✓ Done', '✓ Hecho', '✓ 完成', '✓ Tapos'),
  markChanged: L('Did it differently', 'Lo hicimos distinto', '换了方式', 'Iba ang ginawa'),
  markSkipped: L('Skipped', 'Saltado', '跳过', 'Nilaktawan'),
  undo: L('Undo', 'Deshacer', '撤销', 'Ibalik'),
  comingUp: L(
    'Coming up. You can mark it on the day.',
    'Próximamente. Puedes marcarla ese día.',
    '还没到时间，当天再标记。',
    'Darating pa. Maaari mo itong i-mark sa araw na iyon.'
  ),

  howDidTheyLikeIt: L('How did {child} like it?', '¿Qué tal le pareció a {child}?', '{child}喜欢吗？', 'Nagustuhan ba ni {child}?'),
  loved: L('😍 Loved it', '😍 Le encantó', '😍 很喜欢', '😍 Gustong-gusto'),
  ok: L('🙂 OK', '🙂 Bien', '🙂 还行', '🙂 Okay lang'),
  notToday: L('😕 Not today', '😕 Hoy no', '😕 今天不想', '😕 Hindi ngayon'),
  noteFor: L('Note for {parent} (optional)', 'Nota para {parent} (opcional)', '给{parent}的备注（可选）', 'Paalala para kay {parent} (opsyonal)'),
  notePlaceholder: L('She stacked 4 blocks!', '¡Apiló 4 bloques!', '她搭了4块积木！', 'Nakapagpatong siya ng 4 na block!'),
  saveNote: L('Save note', 'Guardar nota', '保存备注', 'I-save'),

  aboutToday: L('About today', 'Sobre hoy', '今天的情况', 'Tungkol ngayon'),
  napped: L('😴 Napped', '😴 Tomó siesta', '😴 睡了午觉', '😴 Nakatulog'),
  unwell: L('🤒 Seems unwell', '🤒 No se siente bien', '🤒 好像不舒服', '🤒 Masama ang pakiramdam'),
  unwellHint: L(
    'Marking “seems unwell” tells {parent} right away.',
    'Marcar “no se siente bien” le avisa a {parent} enseguida.',
    '标记“好像不舒服”会马上通知{parent}。',
    'Kapag minarkahan ang “masama ang pakiramdam”, malalaman agad ni {parent}.'
  ),

  messageParent: L('Message {parent}', 'Escribir a {parent}', '给{parent}发消息', 'Mag-message kay {parent}'),
  chatTitle: L('Messages with {parent}', 'Mensajes con {parent}', '与{parent}的消息', 'Mga mensahe kay {parent}'),
  chatHint: L(
    'Questions about medicine, pickup or anything that worries you go straight to {parent}.',
    'Las preguntas sobre medicinas, recogidas o cualquier preocupación le llegan directo a {parent}.',
    '关于用药、接送或任何担心的问题，都会直接转给{parent}。',
    'Ang mga tanong tungkol sa gamot, sundo o anumang alalahanin ay diretso kay {parent}.'
  ),
  noMessages: L('No messages yet.', 'Todavía no hay mensajes.', '还没有消息。', 'Wala pang mensahe.'),
  send: L('Send', 'Enviar', '发送', 'Ipadala'),
  you: L('You', 'Tú', '您', 'Ikaw'),
  taraReminder: L('TARA reminder', 'Recordatorio de TARA', 'TARA提醒', 'Paalala ng TARA'),
  read: L('read', 'leído', '已读', 'nabasa'),

  meTitle: L('Me', 'Yo', '我', 'Ako'),
  meSubtitle: L('Caring for {child} with {parent}.', 'Cuidando a {child} con {parent}.', '和{parent}一起照顾{child}。', 'Inaalagaan si {child} kasama si {parent}.'),
  language: L('Language', 'Idioma', '语言', 'Wika'),
  languageHint: L(
    'TARA and library activities appear in this language.',
    'TARA y las actividades de la biblioteca aparecen en este idioma.',
    'TARA和活动库里的活动会用这种语言显示。',
    'Lalabas ang TARA at mga aktibidad sa library sa wikang ito.'
  ),
  parentPhone: L("{parent}'s phone", 'Teléfono de {parent}', '{parent}的电话', 'Telepono ni {parent}'),
  call: L('Call', 'Llamar', '打电话', 'Tumawag'),
  sharedWithYou: L('What {parent} shares with you', 'Lo que {parent} comparte contigo', '{parent}与您分享的内容', 'Ibinabahagi ni {parent} sa iyo'),
  sharesPlan: L('Your activities', 'Tus actividades', '您的活动', 'Iyong mga aktibidad'),
  sharesGoals: L('Their goals for {child}', 'Sus metas para {child}', '对{child}的目标', 'Mga layunin para kay {child}'),
  sharesDay: L('How the day went so far', 'Cómo va el día', '今天到目前为止的情况', 'Kumusta ang araw sa ngayon'),
  signedInAs: L('Signed in as {email}', 'Sesión iniciada como {email}', '登录账号：{email}', 'Naka-sign in bilang {email}'),
  signOut: L('Sign out', 'Cerrar sesión', '退出登录', 'Mag-sign out'),
};

export type CaregiverTextKey = keyof typeof CT;

/** Caregiver UI text in `lang`, with {placeholders} filled in. */
export const ct = (lang: Language, key: CaregiverTextKey, vars: Record<string, string | number> = {}) =>
  fill(CT[key][lang], Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)])));
