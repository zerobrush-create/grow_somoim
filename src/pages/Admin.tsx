import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Users as UsersIcon, BookOpen, Flag, MessageSquare, Download, TrendingUp, Search as SearchIcon, UserCog, Coins, Trash2, Archive, RotateCcw, CheckCircle2, XCircle, Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/i18n/translations";
import { displayText, formatDateTime } from "@/i18n/format";

const adminLabels = {
  ko: {
    title: "관리자",
    stats: "통계",
    reports: "신고",
    manage: "관리",
    totalUsers: "전체 사용자",
    groups: "모임",
    classes: "클래스",
    dms: "DM",
    trend: "가입·모임·신고 추이",
    days: "일",
    signups: "가입",
    csvExport: "CSV 내보내기",
    users: "사용자",
    instructor: "강사",
    ads: "광고",
    banners: "배너",
    roles: "역할",
    points: "포인트",
    noExportData: "내보낼 데이터가 없어요",
    done: "처리 완료",
    error: "오류",
    saveFailed: "저장 실패",
    statusFailed: "상태 변경 실패",
    deleteFailed: "삭제 실패",
    noteSaveFailed: "메모 저장 실패",
    userIdRequired: "user id를 입력하세요",
    pointUserIdRequired: "유저 ID를 입력하세요",
    pointAmountRequired: "포인트 금액을 입력하세요",
    titleRequired: "제목을 입력하세요",
    groupNameRequired: "모임명을 입력하세요",
    roleGranted: "역할이 부여되었어요",
    roleChanged: "역할이 변경되었어요",
    roleChangeFailed: "역할 변경 실패",
    userSettingsSaved: "회원 설정이 저장되었어요",
    inactiveBannerCreated: "승인 시 비활성 배너가 생성됐어요",
    imageUploaded: "이미지가 업로드되었어요",
    imageUploadFailed: "이미지 업로드 실패",
    tryAgain: "다시 시도해주세요",
    bannerCreated: "배너가 생성되었어요",
    groupDeleted: "모임이 삭제되었어요",
    groupSaved: "모임 정보가 저장되었어요",
    groupStatusChanged: "모임 상태가 변경되었어요",
    classStatusChanged: "클래스 상태가 변경되었어요",
    classNoteSaved: "관리 메모가 저장되었어요",
    classDeleted: "클래스가 삭제되었어요",
    pointsGranted: "포인트가 지급되었어요",
    pointDeleted: "포인트 내역이 삭제되었어요",
    loading: "불러오는 중...",
    adminRequired: "관리자 권한이 필요해요",
    home: "홈으로",
    reporter: "신고자",
    target: "대상",
    resolve: "해결",
    reject: "기각",
    noReports: "신고 내역이 없어요",
    approve: "승인",
    decline: "거절",
    noApplications: "신청 내역이 없어요",
    noAdRequests: "광고 요청이 없어요",
    createBannerDirect: "배너 직접 생성",
    bannerTitlePlaceholder: "제목 *",
    bannerImagePlaceholder: "이미지 URL (선택)",
    uploading: "업로드 중...",
    uploadImage: "이미지 업로드",
    bannerLinkPlaceholder: "링크 URL (선택)",
    bannerOrderPlaceholder: "순서 (기본 10)",
    createBanner: "배너 생성",
    order: "순서",
    active: "활성",
    inactive: "비활성",
    delete: "삭제",
    noBanners: "배너가 없어요",
    grantRole: "역할 부여",
    grant: "부여",
    revoke: "해제",
    noRoles: "역할 데이터가 없어요",
    userSearchPlaceholder: "닉네임·이메일·이름·UUID 검색 (2자 이상)",
    groupsHidden: "모임 숨김",
    groupsVisible: "모임 공개",
    profile: "프로필",
    addAdmin: "관리자 추가",
    roleFormAdded: "역할 부여 폼에 추가되었어요",
    pointFormAdded: "포인트 폼에 추가되었어요",
    noSearchResults: "검색 결과가 없어요",
    enterSearch: "닉네임·이메일·이름을 입력해 검색하세요",
    groupSearchPlaceholder: "모임명·카테고리 검색",
    groupName: "모임명",
    category: "카테고리",
    location: "지역",
    capacity: "정원",
    save: "저장",
    cancel: "취소",
    edit: "수정",
    archive: "보관",
    restore: "복구",
    confirmDeleteGroup: "모임을 삭제할까요?",
    noGroups: "모임이 없어요",
    classSearchPlaceholder: "클래스명·카테고리·강사 UUID 검색",
    uncategorized: "미분류",
    pending: "대기",
    approved: "승인됨",
    rejected: "거절됨",
    resolved: "해결됨",
    archived: "보관됨",
    adminRole: "관리자",
    instructorRole: "강사",
    memberRole: "멤버",
    instructorId: "강사",
    adminNote: "관리 메모",
    saveNote: "메모 저장",
    confirmDeleteClass: "클래스를 삭제할까요?",
    noClasses: "클래스가 없어요",
    grantPoints: "포인트 지급",
    pointUserPlaceholder: "유저 UUID *",
    pointAmountPlaceholder: "포인트 (음수=차감) *",
    pointReasonPlaceholder: "사유 (기본: 관리자 지급)",
    defaultPointReason: "관리자 지급",
    submitGrant: "지급하기",
    pointHelp: "유저 검색 탭에서 포인트 버튼을 누르면 UUID가 자동 입력됩니다.",
    recentPoints: "최근 포인트 내역",
    noPoints: "포인트 내역이 없어요",
    confirmDeletePoint: "이 포인트 내역을 삭제할까요?",
    promoBanner: "광고 배너 #",
    col_id: "ID",
    col_email: "이메일",
    col_name: "이름",
    col_nickname: "닉네임",
    col_location: "지역",
    col_created_at: "생성일",
    col_category: "카테고리",
    col_owner_id: "모임장 ID",
    col_reporter_id: "신고자 ID",
    col_target_type: "대상 유형",
    col_target_id: "대상 ID",
    col_reason: "사유",
    col_status: "상태",
    col_title: "제목",
    col_instructor_id: "강사 ID",
    col_price: "가격",
  },
  en: {
    title: "Admin",
    stats: "Stats",
    reports: "Reports",
    manage: "Manage",
    totalUsers: "Total users",
    groups: "Groups",
    classes: "Classes",
    dms: "DM",
    trend: "Signups, groups, reports",
    days: "d",
    signups: "Signups",
    csvExport: "Export CSV",
    users: "Users",
    instructor: "Instructor",
    ads: "Ads",
    banners: "Banners",
    roles: "Roles",
    points: "Points",
    noExportData: "No data to export",
    done: "Done",
    error: "Error",
    saveFailed: "Save failed",
    statusFailed: "Status update failed",
    deleteFailed: "Delete failed",
    noteSaveFailed: "Note save failed",
    userIdRequired: "Enter a user id",
    pointUserIdRequired: "Enter a user ID",
    pointAmountRequired: "Enter a point amount",
    titleRequired: "Enter a title",
    groupNameRequired: "Enter a group name",
    roleGranted: "Role granted",
    roleChanged: "Role updated",
    roleChangeFailed: "Role update failed",
    userSettingsSaved: "User settings saved",
    inactiveBannerCreated: "An inactive banner was created after approval",
    imageUploaded: "Image uploaded",
    imageUploadFailed: "Image upload failed",
    tryAgain: "Please try again",
    bannerCreated: "Banner created",
    groupDeleted: "Group deleted",
    groupSaved: "Group saved",
    groupStatusChanged: "Group status updated",
    classStatusChanged: "Class status updated",
    classNoteSaved: "Admin note saved",
    classDeleted: "Class deleted",
    pointsGranted: "Points granted",
    pointDeleted: "Point record deleted",
    loading: "Loading...",
    adminRequired: "Admin permission is required",
    home: "Home",
    reporter: "Reporter",
    target: "Target",
    resolve: "Resolve",
    reject: "Reject",
    noReports: "No reports",
    approve: "Approve",
    decline: "Decline",
    noApplications: "No applications",
    noAdRequests: "No ad requests",
    createBannerDirect: "Create banner",
    bannerTitlePlaceholder: "Title *",
    bannerImagePlaceholder: "Image URL (optional)",
    uploading: "Uploading...",
    uploadImage: "Upload image",
    bannerLinkPlaceholder: "Link URL (optional)",
    bannerOrderPlaceholder: "Order (default 10)",
    createBanner: "Create banner",
    order: "Order",
    active: "Active",
    inactive: "Inactive",
    delete: "Delete",
    noBanners: "No banners",
    grantRole: "Grant role",
    grant: "Grant",
    revoke: "Revoke",
    noRoles: "No role data",
    userSearchPlaceholder: "Search nickname, email, name, or UUID (2+ chars)",
    groupsHidden: "Groups hidden",
    groupsVisible: "Groups visible",
    profile: "Profile",
    addAdmin: "Add admin",
    roleFormAdded: "Added to role form",
    pointFormAdded: "Added to points form",
    noSearchResults: "No search results",
    enterSearch: "Enter a nickname, email, or name to search",
    groupSearchPlaceholder: "Search group name or category",
    groupName: "Group name",
    category: "Category",
    location: "Location",
    capacity: "Capacity",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    archive: "Archive",
    restore: "Restore",
    confirmDeleteGroup: "Delete this group?",
    noGroups: "No groups",
    classSearchPlaceholder: "Search class name, category, or instructor UUID",
    uncategorized: "Uncategorized",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    resolved: "Resolved",
    archived: "Archived",
    adminRole: "Admin",
    instructorRole: "Instructor",
    memberRole: "Member",
    instructorId: "Instructor",
    adminNote: "Admin note",
    saveNote: "Save note",
    confirmDeleteClass: "Delete this class?",
    noClasses: "No classes",
    grantPoints: "Grant points",
    pointUserPlaceholder: "User UUID *",
    pointAmountPlaceholder: "Points (negative = deduct) *",
    pointReasonPlaceholder: "Reason (default: admin grant)",
    defaultPointReason: "Admin grant",
    submitGrant: "Grant",
    pointHelp: "Tap the Points button in the Users tab to auto-fill the UUID.",
    recentPoints: "Recent point history",
    noPoints: "No point history",
    confirmDeletePoint: "Delete this point record?",
    promoBanner: "Ad banner #",
    col_id: "ID",
    col_email: "Email",
    col_name: "Name",
    col_nickname: "Nickname",
    col_location: "Location",
    col_created_at: "Created at",
    col_category: "Category",
    col_owner_id: "Owner ID",
    col_reporter_id: "Reporter ID",
    col_target_type: "Target type",
    col_target_id: "Target ID",
    col_reason: "Reason",
    col_status: "Status",
    col_title: "Title",
    col_instructor_id: "Instructor ID",
    col_price: "Price",
  },
  ja: {
    title: "管理者",
    stats: "統計",
    reports: "通報",
    manage: "管理",
    totalUsers: "全ユーザー",
    groups: "グループ",
    classes: "クラス",
    dms: "DM",
    trend: "登録・グループ・通報の推移",
    days: "日",
    signups: "登録",
    csvExport: "CSV出力",
    users: "ユーザー",
    instructor: "講師",
    ads: "広告",
    banners: "バナー",
    roles: "権限",
    points: "ポイント",
    noExportData: "出力するデータがありません",
    done: "完了",
    error: "エラー",
    saveFailed: "保存に失敗しました",
    statusFailed: "ステータス変更に失敗しました",
    deleteFailed: "削除に失敗しました",
    noteSaveFailed: "メモ保存に失敗しました",
    userIdRequired: "ユーザーIDを入力してください",
    pointUserIdRequired: "ユーザーIDを入力してください",
    pointAmountRequired: "ポイント数を入力してください",
    titleRequired: "タイトルを入力してください",
    groupNameRequired: "グループ名を入力してください",
    roleGranted: "権限を付与しました",
    roleChanged: "権限を変更しました",
    roleChangeFailed: "権限変更に失敗しました",
    userSettingsSaved: "ユーザー設定を保存しました",
    inactiveBannerCreated: "承認後、非アクティブなバナーを作成しました",
    imageUploaded: "画像をアップロードしました",
    imageUploadFailed: "画像アップロードに失敗しました",
    tryAgain: "もう一度お試しください",
    bannerCreated: "バナーを作成しました",
    groupDeleted: "グループを削除しました",
    groupSaved: "グループ情報を保存しました",
    groupStatusChanged: "グループ状態を変更しました",
    classStatusChanged: "クラス状態を変更しました",
    classNoteSaved: "管理メモを保存しました",
    classDeleted: "クラスを削除しました",
    pointsGranted: "ポイントを付与しました",
    pointDeleted: "ポイント履歴を削除しました",
    loading: "読み込み中...",
    adminRequired: "管理者権限が必要です",
    home: "ホーム",
    reporter: "通報者",
    target: "対象",
    resolve: "解決",
    reject: "却下",
    noReports: "通報履歴がありません",
    approve: "承認",
    decline: "拒否",
    noApplications: "申請履歴がありません",
    noAdRequests: "広告申請がありません",
    createBannerDirect: "バナー作成",
    bannerTitlePlaceholder: "タイトル *",
    bannerImagePlaceholder: "画像URL（任意）",
    uploading: "アップロード中...",
    uploadImage: "画像をアップロード",
    bannerLinkPlaceholder: "リンクURL（任意）",
    bannerOrderPlaceholder: "順序（既定10）",
    createBanner: "バナー作成",
    order: "順序",
    active: "有効",
    inactive: "無効",
    delete: "削除",
    noBanners: "バナーがありません",
    grantRole: "権限付与",
    grant: "付与",
    revoke: "解除",
    noRoles: "権限データがありません",
    userSearchPlaceholder: "ニックネーム・メール・名前・UUIDで検索（2文字以上）",
    groupsHidden: "グループ非表示",
    groupsVisible: "グループ表示",
    profile: "プロフィール",
    addAdmin: "管理者追加",
    roleFormAdded: "権限フォームに追加しました",
    pointFormAdded: "ポイントフォームに追加しました",
    noSearchResults: "検索結果がありません",
    enterSearch: "ニックネーム・メール・名前を入力してください",
    groupSearchPlaceholder: "グループ名・カテゴリ検索",
    groupName: "グループ名",
    category: "カテゴリ",
    location: "地域",
    capacity: "定員",
    save: "保存",
    cancel: "キャンセル",
    edit: "編集",
    archive: "アーカイブ",
    restore: "復元",
    confirmDeleteGroup: "このグループを削除しますか？",
    noGroups: "グループがありません",
    classSearchPlaceholder: "クラス名・カテゴリ・講師UUID検索",
    uncategorized: "未分類",
    pending: "待機中",
    approved: "承認済み",
    rejected: "拒否済み",
    resolved: "解決済み",
    archived: "アーカイブ済み",
    adminRole: "管理者",
    instructorRole: "講師",
    memberRole: "メンバー",
    instructorId: "講師",
    adminNote: "管理メモ",
    saveNote: "メモ保存",
    confirmDeleteClass: "このクラスを削除しますか？",
    noClasses: "クラスがありません",
    grantPoints: "ポイント付与",
    pointUserPlaceholder: "ユーザーUUID *",
    pointAmountPlaceholder: "ポイント（負数=差引）*",
    pointReasonPlaceholder: "理由（既定: 管理者付与）",
    defaultPointReason: "管理者付与",
    submitGrant: "付与",
    pointHelp: "ユーザータブのポイントボタンを押すとUUIDが自動入力されます。",
    recentPoints: "最近のポイント履歴",
    noPoints: "ポイント履歴がありません",
    confirmDeletePoint: "このポイント履歴を削除しますか？",
    promoBanner: "広告バナー #",
    col_id: "ID",
    col_email: "メール",
    col_name: "名前",
    col_nickname: "ニックネーム",
    col_location: "地域",
    col_created_at: "作成日",
    col_category: "カテゴリ",
    col_owner_id: "主催者ID",
    col_reporter_id: "通報者ID",
    col_target_type: "対象タイプ",
    col_target_id: "対象ID",
    col_reason: "理由",
    col_status: "状態",
    col_title: "タイトル",
    col_instructor_id: "講師ID",
    col_price: "価格",
  },
  zh: {
    title: "管理员",
    stats: "统计",
    reports: "举报",
    manage: "管理",
    totalUsers: "全部用户",
    groups: "圈子",
    classes: "课程",
    dms: "DM",
    trend: "注册、圈子、举报趋势",
    days: "天",
    signups: "注册",
    csvExport: "导出 CSV",
    users: "用户",
    instructor: "讲师",
    ads: "广告",
    banners: "横幅",
    roles: "角色",
    points: "积分",
    noExportData: "没有可导出的数据",
    done: "已完成",
    error: "错误",
    saveFailed: "保存失败",
    statusFailed: "状态更新失败",
    deleteFailed: "删除失败",
    noteSaveFailed: "备注保存失败",
    userIdRequired: "请输入用户 ID",
    pointUserIdRequired: "请输入用户 ID",
    pointAmountRequired: "请输入积分数量",
    titleRequired: "请输入标题",
    groupNameRequired: "请输入圈子名称",
    roleGranted: "角色已授予",
    roleChanged: "角色已更新",
    roleChangeFailed: "角色更新失败",
    userSettingsSaved: "用户设置已保存",
    inactiveBannerCreated: "审批后已创建未启用横幅",
    imageUploaded: "图片已上传",
    imageUploadFailed: "图片上传失败",
    tryAgain: "请重试",
    bannerCreated: "横幅已创建",
    groupDeleted: "圈子已删除",
    groupSaved: "圈子信息已保存",
    groupStatusChanged: "圈子状态已更新",
    classStatusChanged: "课程状态已更新",
    classNoteSaved: "管理备注已保存",
    classDeleted: "课程已删除",
    pointsGranted: "积分已发放",
    pointDeleted: "积分记录已删除",
    loading: "加载中...",
    adminRequired: "需要管理员权限",
    home: "首页",
    reporter: "举报人",
    target: "对象",
    resolve: "解决",
    reject: "驳回",
    noReports: "没有举报记录",
    approve: "批准",
    decline: "拒绝",
    noApplications: "没有申请记录",
    noAdRequests: "没有广告申请",
    createBannerDirect: "创建横幅",
    bannerTitlePlaceholder: "标题 *",
    bannerImagePlaceholder: "图片 URL（可选）",
    uploading: "上传中...",
    uploadImage: "上传图片",
    bannerLinkPlaceholder: "链接 URL（可选）",
    bannerOrderPlaceholder: "顺序（默认 10）",
    createBanner: "创建横幅",
    order: "顺序",
    active: "启用",
    inactive: "停用",
    delete: "删除",
    noBanners: "没有横幅",
    grantRole: "授予角色",
    grant: "授予",
    revoke: "撤销",
    noRoles: "没有角色数据",
    userSearchPlaceholder: "搜索昵称、邮箱、姓名或 UUID（至少2字）",
    groupsHidden: "隐藏圈子",
    groupsVisible: "显示圈子",
    profile: "个人资料",
    addAdmin: "添加管理员",
    roleFormAdded: "已添加到角色表单",
    pointFormAdded: "已添加到积分表单",
    noSearchResults: "没有搜索结果",
    enterSearch: "请输入昵称、邮箱或姓名搜索",
    groupSearchPlaceholder: "搜索圈子名或分类",
    groupName: "圈子名称",
    category: "分类",
    location: "地区",
    capacity: "容量",
    save: "保存",
    cancel: "取消",
    edit: "编辑",
    archive: "归档",
    restore: "恢复",
    confirmDeleteGroup: "要删除这个圈子吗？",
    noGroups: "没有圈子",
    classSearchPlaceholder: "搜索课程名、分类或讲师 UUID",
    uncategorized: "未分类",
    pending: "待处理",
    approved: "已批准",
    rejected: "已拒绝",
    resolved: "已解决",
    archived: "已归档",
    adminRole: "管理员",
    instructorRole: "讲师",
    memberRole: "成员",
    instructorId: "讲师",
    adminNote: "管理备注",
    saveNote: "保存备注",
    confirmDeleteClass: "要删除这个课程吗？",
    noClasses: "没有课程",
    grantPoints: "发放积分",
    pointUserPlaceholder: "用户 UUID *",
    pointAmountPlaceholder: "积分（负数=扣除）*",
    pointReasonPlaceholder: "原因（默认：管理员发放）",
    defaultPointReason: "管理员发放",
    submitGrant: "发放",
    pointHelp: "在用户标签中点击积分按钮会自动填入 UUID。",
    recentPoints: "最近积分记录",
    noPoints: "没有积分记录",
    confirmDeletePoint: "要删除这条积分记录吗？",
    promoBanner: "广告横幅 #",
    col_id: "ID",
    col_email: "邮箱",
    col_name: "姓名",
    col_nickname: "昵称",
    col_location: "地区",
    col_created_at: "创建时间",
    col_category: "分类",
    col_owner_id: "圈主 ID",
    col_reporter_id: "举报人 ID",
    col_target_type: "对象类型",
    col_target_id: "对象 ID",
    col_reason: "原因",
    col_status: "状态",
    col_title: "标题",
    col_instructor_id: "讲师 ID",
    col_price: "价格",
  },
  ru: {
    title: "Администратор",
    stats: "Статистика",
    reports: "Жалобы",
    manage: "Управление",
    totalUsers: "Всего пользователей",
    groups: "Группы",
    classes: "Занятия",
    dms: "DM",
    trend: "Регистрации, группы, жалобы",
    days: " дн.",
    signups: "Регистрации",
    csvExport: "Экспорт CSV",
    users: "Пользователи",
    instructor: "Преподаватель",
    ads: "Реклама",
    banners: "Баннеры",
    roles: "Роли",
    points: "Баллы",
    noExportData: "Нет данных для экспорта",
    done: "Готово",
    error: "Ошибка",
    saveFailed: "Не удалось сохранить",
    statusFailed: "Не удалось изменить статус",
    deleteFailed: "Не удалось удалить",
    noteSaveFailed: "Не удалось сохранить заметку",
    userIdRequired: "Введите ID пользователя",
    pointUserIdRequired: "Введите ID пользователя",
    pointAmountRequired: "Введите количество баллов",
    titleRequired: "Введите заголовок",
    groupNameRequired: "Введите название группы",
    roleGranted: "Роль назначена",
    roleChanged: "Роль обновлена",
    roleChangeFailed: "Не удалось обновить роль",
    userSettingsSaved: "Настройки пользователя сохранены",
    inactiveBannerCreated: "После одобрения создан неактивный баннер",
    imageUploaded: "Изображение загружено",
    imageUploadFailed: "Не удалось загрузить изображение",
    tryAgain: "Попробуйте еще раз",
    bannerCreated: "Баннер создан",
    groupDeleted: "Группа удалена",
    groupSaved: "Группа сохранена",
    groupStatusChanged: "Статус группы обновлен",
    classStatusChanged: "Статус занятия обновлен",
    classNoteSaved: "Заметка администратора сохранена",
    classDeleted: "Занятие удалено",
    pointsGranted: "Баллы начислены",
    pointDeleted: "Запись баллов удалена",
    loading: "Загрузка...",
    adminRequired: "Требуются права администратора",
    home: "Главная",
    reporter: "Автор жалобы",
    target: "Объект",
    resolve: "Решить",
    reject: "Отклонить",
    noReports: "Жалоб нет",
    approve: "Одобрить",
    decline: "Отказать",
    noApplications: "Заявок нет",
    noAdRequests: "Заявок на рекламу нет",
    createBannerDirect: "Создать баннер",
    bannerTitlePlaceholder: "Заголовок *",
    bannerImagePlaceholder: "URL изображения (необязательно)",
    uploading: "Загрузка...",
    uploadImage: "Загрузить изображение",
    bannerLinkPlaceholder: "URL ссылки (необязательно)",
    bannerOrderPlaceholder: "Порядок (по умолчанию 10)",
    createBanner: "Создать баннер",
    order: "Порядок",
    active: "Активен",
    inactive: "Неактивен",
    delete: "Удалить",
    noBanners: "Баннеров нет",
    grantRole: "Назначить роль",
    grant: "Назначить",
    revoke: "Отозвать",
    noRoles: "Нет данных ролей",
    userSearchPlaceholder: "Поиск по нику, email, имени или UUID (2+ символа)",
    groupsHidden: "Группы скрыты",
    groupsVisible: "Группы видны",
    profile: "Профиль",
    addAdmin: "Добавить админа",
    roleFormAdded: "Добавлено в форму ролей",
    pointFormAdded: "Добавлено в форму баллов",
    noSearchResults: "Ничего не найдено",
    enterSearch: "Введите ник, email или имя для поиска",
    groupSearchPlaceholder: "Поиск группы или категории",
    groupName: "Название группы",
    category: "Категория",
    location: "Локация",
    capacity: "Лимит",
    save: "Сохранить",
    cancel: "Отмена",
    edit: "Изменить",
    archive: "Архив",
    restore: "Восстановить",
    confirmDeleteGroup: "Удалить эту группу?",
    noGroups: "Групп нет",
    classSearchPlaceholder: "Поиск занятия, категории или UUID преподавателя",
    uncategorized: "Без категории",
    pending: "Ожидает",
    approved: "Одобрено",
    rejected: "Отклонено",
    resolved: "Решено",
    archived: "В архиве",
    adminRole: "Админ",
    instructorRole: "Преподаватель",
    memberRole: "Участник",
    instructorId: "Преподаватель",
    adminNote: "Заметка админа",
    saveNote: "Сохранить заметку",
    confirmDeleteClass: "Удалить это занятие?",
    noClasses: "Занятий нет",
    grantPoints: "Начислить баллы",
    pointUserPlaceholder: "UUID пользователя *",
    pointAmountPlaceholder: "Баллы (минус = списать) *",
    pointReasonPlaceholder: "Причина (по умолчанию: начисление админом)",
    defaultPointReason: "Начисление админом",
    submitGrant: "Начислить",
    pointHelp: "Нажмите кнопку Баллы во вкладке пользователей, чтобы UUID подставился автоматически.",
    recentPoints: "Последняя история баллов",
    noPoints: "Истории баллов нет",
    confirmDeletePoint: "Удалить эту запись баллов?",
    promoBanner: "Рекламный баннер #",
    col_id: "ID",
    col_email: "Email",
    col_name: "Имя",
    col_nickname: "Ник",
    col_location: "Локация",
    col_created_at: "Создано",
    col_category: "Категория",
    col_owner_id: "ID владельца",
    col_reporter_id: "ID автора жалобы",
    col_target_type: "Тип объекта",
    col_target_id: "ID объекта",
    col_reason: "Причина",
    col_status: "Статус",
    col_title: "Заголовок",
    col_instructor_id: "ID преподавателя",
    col_price: "Цена",
  },
} satisfies Record<Language, Record<string, string>>;

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { lang } = useLanguage();
  const a = adminLabels[lang];
  const qc = useQueryClient();

  const statusLabel = (status?: string | null) => {
    if (!status) return "";
    const key = status as "pending" | "approved" | "rejected" | "resolved" | "archived" | "active";
    return {
      pending: a.pending,
      approved: a.approved,
      rejected: a.rejected,
      resolved: a.resolved,
      archived: a.archived,
      active: a.active,
    }[key] ?? displayText(status, lang);
  };

  const roleLabel = (role?: string | null) => {
    if (!role) return "";
    const key = role as "admin" | "instructor" | "member";
    return {
      admin: a.adminRole,
      instructor: a.instructorRole,
      member: a.memberRole,
    }[key] ?? displayText(role, lang);
  };

  const csvValue = (key: string, value: unknown) => {
    if (value === null || value === undefined) return "";
    if (key === "created_at") return formatDateTime(String(value), lang);
    if (key === "status") return statusLabel(String(value));
    if (key === "role") return roleLabel(String(value));
    if (["name", "nickname", "category", "location", "title", "reason", "description", "target_type", "type", "price"].includes(key)) {
      return displayText(String(value), lang);
    }
    return String(value);
  };

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const { data: instructorApps } = useQuery({
    queryKey: ["admin-instructor-apps"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("instructor_applications").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: adRequests } = useQuery({
    queryKey: ["admin-ad-requests"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("ad_requests").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: banners } = useQuery({
    queryKey: ["admin-banners"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("banners").select("*").order("order")).data ?? [],
  });

  const { data: pointHistory } = useQuery({
    queryKey: ["admin-points"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("points").select("id,user_id,amount,type,description,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-user-roles"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("user_roles").select("id,user_id,role,created_at").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("reports").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [u, g, c, dm] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("groups").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("direct_messages").select("id", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, groups: g.count ?? 0, classes: c.count ?? 0, dms: dm.count ?? 0 };
    },
  });

  const [rangeDays, setRangeDays] = useState<7 | 30 | 90>(30);
  const sinceIso = useMemo(
    () => new Date(Date.now() - rangeDays * 86400000).toISOString(),
    [rangeDays],
  );

  const { data: trend } = useQuery({
    queryKey: ["admin-trend", rangeDays],
    enabled: !!isAdmin,
    queryFn: async () => {
      const [users, groups, reports] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", sinceIso).limit(5000),
        supabase.from("groups").select("created_at").gte("created_at", sinceIso).limit(5000),
        supabase.from("reports").select("created_at").gte("created_at", sinceIso).limit(5000),
      ]);
      const buckets: Record<string, { date: string; users: number; groups: number; reports: number }> = {};
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
        buckets[d] = { date: d.slice(5), users: 0, groups: 0, reports: 0 };
      }
      const bump = (rows: { created_at: string }[] | null, key: "users" | "groups" | "reports") => {
        (rows ?? []).forEach((r) => {
          const d = r.created_at.slice(0, 10);
          if (buckets[d]) buckets[d][key] += 1;
        });
      };
      bump(users.data as any, "users");
      bump(groups.data as any, "groups");
      bump(reports.data as any, "reports");
      return Object.values(buckets);
    },
  });

  const exportCsv = (rows: Record<string, unknown>[], filename: string) => {
    if (!rows.length) {
      toast({ title: a.noExportData, variant: "destructive" });
      return;
    }
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.map((h) => escape(a[`col_${h}`] ?? h)).join(","),
      ...rows.map((r) => headers.map((h) => escape(csvValue(h, r[h]))).join(",")),
    ].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateReport = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { error } = await supabase.from("reports").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: a.done }); qc.invalidateQueries({ queryKey: ["admin-reports"] }); },
  });

  const [grantId, setGrantId] = useState("");
  const [grantRole, setGrantRole] = useState<"admin" | "instructor" | "member">("instructor");

  const [userSearch, setUserSearch] = useState("");
  const isUuidSearch = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
  const { data: foundUsers } = useQuery({
    queryKey: ["admin-user-search", userSearch],
    enabled: !!isAdmin && userSearch.trim().length >= 2,
    queryFn: async () => {
      const rawTerm = userSearch.trim();
      const baseQuery = supabase
        .from("users")
        .select("id,email,first_name,last_name,nickname,profile_location,role,show_groups,created_at");
      const { data } = isUuidSearch(rawTerm)
        ? await baseQuery.eq("id", rawTerm).limit(1)
        : await baseQuery
          .or(`nickname.ilike.%${rawTerm}%,email.ilike.%${rawTerm}%,first_name.ilike.%${rawTerm}%,last_name.ilike.%${rawTerm}%`)
          .limit(20);
      return data ?? [];
    },
  });

  const grantRoleMut = useMutation({
    mutationFn: async () => {
      if (!grantId.trim()) throw new Error(a.userIdRequired);
      const { error } = await supabase.from("user_roles").insert({ user_id: grantId.trim(), role: grantRole });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: a.roleGranted }); setGrantId(""); qc.invalidateQueries({ queryKey: ["admin-user-roles"] }); },
    onError: (e: Error) => toast({ title: a.error, description: e.message, variant: "destructive" }),
  });

  const grantRoleToUser = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "instructor" | "member" }) => {
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (roleError && !roleError.message.toLowerCase().includes("duplicate")) throw roleError;
      const { error: userError } = await supabase.from("users").update({ role }).eq("id", userId);
      if (userError) throw userError;
    },
    onSuccess: () => {
      toast({ title: a.roleChanged });
      qc.invalidateQueries({ queryKey: ["admin-user-roles"] });
      qc.invalidateQueries({ queryKey: ["admin-user-search"] });
    },
    onError: (e: Error) => toast({ title: a.roleChangeFailed, description: e.message, variant: "destructive" }),
  });

  const updateUserVisibility = useMutation({
    mutationFn: async ({ userId, showGroups }: { userId: string; showGroups: boolean }) => {
      const { error } = await supabase.from("users").update({ show_groups: showGroups }).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.userSettingsSaved });
      qc.invalidateQueries({ queryKey: ["admin-user-search"] });
    },
    onError: (e: Error) => toast({ title: a.saveFailed, description: e.message, variant: "destructive" }),
  });

  const revokeRole = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("user_roles").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-user-roles"] }),
  });

  const updateApp = useMutation({
    mutationFn: async ({ id, status, applicantId }: { id: number; status: "approved" | "rejected"; applicantId: string }) => {
      const { error } = await supabase.from("instructor_applications").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("user_roles").insert({ user_id: applicantId, role: "instructor" }).select();
      }
    },
    onSuccess: () => { toast({ title: a.done }); qc.invalidateQueries({ queryKey: ["admin-instructor-apps"] }); },
    onError: (e: Error) => toast({ title: a.error, description: e.message, variant: "destructive" }),
  });

  const updateAd = useMutation({
    mutationFn: async ({ id, status, requesterId }: { id: number; status: "approved" | "rejected"; requesterId: string }) => {
      const { error } = await supabase.from("ad_requests").update({ status }).eq("id", id);
      if (error) throw error;
      if (status === "approved") {
        await supabase.from("banners").insert({
          title: a.promoBanner + id,
          type: "promo",
          is_active: false,
          order: 99,
          requester_id: requesterId,
        });
      }
    },
    onSuccess: () => {
      toast({ title: a.done, description: a.inactiveBannerCreated });
      qc.invalidateQueries({ queryKey: ["admin-ad-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
  });

  const toggleBanner = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const { error } = await supabase.from("banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const removeBanner = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  // 배너 생성
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerImageUrl, setNewBannerImageUrl] = useState("");
  const [newBannerLinkUrl, setNewBannerLinkUrl] = useState("");
  const [newBannerOrder, setNewBannerOrder] = useState("10");
  const [bannerUploading, setBannerUploading] = useState(false);

  const uploadBannerImage = async (file: File | null) => {
    if (!file || !user) return;
    setBannerUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/admin-banners/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from("post-images").getPublicUrl(path);
      setNewBannerImageUrl(data.publicUrl);
      toast({ title: a.imageUploaded });
    } catch (e) {
      toast({ title: a.imageUploadFailed, description: e instanceof Error ? e.message : a.tryAgain, variant: "destructive" });
    } finally {
      setBannerUploading(false);
    }
  };

  const createBanner = useMutation({
    mutationFn: async () => {
      if (!newBannerTitle.trim()) throw new Error(a.titleRequired);
      const { error } = await supabase.from("banners").insert({
        title: newBannerTitle.trim(),
        image_url: newBannerImageUrl.trim() || null,
        link_url: newBannerLinkUrl.trim() || null,
        order: parseInt(newBannerOrder) || 10,
        type: "promo",
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.bannerCreated });
      setNewBannerTitle(""); setNewBannerImageUrl(""); setNewBannerLinkUrl(""); setNewBannerOrder("10");
      qc.invalidateQueries({ queryKey: ["admin-banners"] });
    },
    onError: (e: Error) => toast({ title: a.error, description: e.message, variant: "destructive" }),
  });

  // 모임 관리
  const { data: allGroups } = useQuery({
    queryKey: ["admin-groups"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("groups").select("id,name,category,location,owner_id,status,max_members,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const [groupSearch, setGroupSearch] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupDraft, setGroupDraft] = useState({ name: "", category: "", location: "", max_members: "" });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("groups").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { toast({ title: a.groupDeleted }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); },
    onError: (e: Error) => toast({ title: a.error, description: e.message, variant: "destructive" }),
  });

  const updateGroup = useMutation({
    mutationFn: async (id: string) => {
      if (!groupDraft.name.trim()) throw new Error(a.groupNameRequired);
      const { error } = await supabase.from("groups").update({
        name: groupDraft.name.trim(),
        category: groupDraft.category.trim() || "취미",
        location: groupDraft.location.trim() || null,
        max_members: groupDraft.max_members ? Number(groupDraft.max_members) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.groupSaved });
      setEditingGroupId(null);
      qc.invalidateQueries({ queryKey: ["admin-groups"] });
    },
    onError: (e: Error) => toast({ title: a.saveFailed, description: e.message, variant: "destructive" }),
  });

  const updateGroupStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "archived" }) => {
      const { error } = await supabase.from("groups").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin-groups"] });
      const previous = qc.getQueryData<any[]>(["admin-groups"]);
      qc.setQueryData<any[]>(["admin-groups"], (current) =>
        (current ?? []).map((group) => (group.id === id ? { ...group, status } : group))
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: a.groupStatusChanged });
      void qc.invalidateQueries({ queryKey: ["home-hot"], refetchType: "inactive" });
      void qc.invalidateQueries({ queryKey: ["home-groups"], refetchType: "inactive" });
      void qc.invalidateQueries({ queryKey: ["groups"], refetchType: "inactive" });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["admin-groups"], context.previous);
      toast({ title: a.statusFailed, description: e.message, variant: "destructive" });
    },
  });

  const filteredGroups = useMemo(() => {
    const term = groupSearch.trim().toLowerCase();
    return term ? (allGroups ?? []).filter((g) => g.name?.toLowerCase().includes(term) || g.category?.toLowerCase().includes(term)) : (allGroups ?? []);
  }, [allGroups, groupSearch]);

  // 클래스 관리
  const { data: allClasses } = useQuery({
    queryKey: ["admin-classes"],
    enabled: !!isAdmin,
    queryFn: async () => (await supabase.from("classes").select("id,title,category,instructor_id,location,price,status,payment_status,admin_note,created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });

  const [classSearch, setClassSearch] = useState("");
  const [classNoteDraft, setClassNoteDraft] = useState<Record<number, string>>({});

  const filteredClasses = useMemo(() => {
    const term = classSearch.trim().toLowerCase();
    return term ? (allClasses ?? []).filter((c) => c.title?.toLowerCase().includes(term) || c.category?.toLowerCase().includes(term) || c.instructor_id?.toLowerCase().includes(term)) : (allClasses ?? []);
  }, [allClasses, classSearch]);

  const updateClassStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "pending" | "approved" | "rejected" }) => {
      const { error } = await supabase.from("classes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ["admin-classes"] });
      const previous = qc.getQueryData<any[]>(["admin-classes"]);
      qc.setQueryData<any[]>(["admin-classes"], (current) =>
        (current ?? []).map((klass) => (klass.id === id ? { ...klass, status } : klass))
      );
      return { previous };
    },
    onSuccess: () => {
      toast({ title: a.classStatusChanged });
      void qc.invalidateQueries({ queryKey: ["classes"], refetchType: "inactive" });
      void qc.invalidateQueries({ queryKey: ["home-classes"], refetchType: "inactive" });
    },
    onError: (e: Error, _vars, context) => {
      if (context?.previous) qc.setQueryData(["admin-classes"], context.previous);
      toast({ title: a.statusFailed, description: e.message, variant: "destructive" });
    },
  });

  const saveClassNote = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("classes").update({ admin_note: classNoteDraft[id] ?? "" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.classNoteSaved });
      qc.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (e: Error) => toast({ title: a.noteSaveFailed, description: e.message, variant: "destructive" }),
  });

  const deleteClass = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.classDeleted });
      qc.invalidateQueries({ queryKey: ["admin-classes"] });
    },
    onError: (e: Error) => toast({ title: a.deleteFailed, description: e.message, variant: "destructive" }),
  });

  // 포인트 지급
  const [pointUserId, setPointUserId] = useState("");
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");

  const grantPoints = useMutation({
    mutationFn: async () => {
      if (!pointUserId.trim()) throw new Error(a.pointUserIdRequired);
      const amount = parseInt(pointAmount);
      if (!amount || isNaN(amount)) throw new Error(a.pointAmountRequired);
      const { error } = await supabase.from("points").insert({
        user_id: pointUserId.trim(),
        amount,
        description: pointReason.trim() || a.defaultPointReason,
        type: "grant" as const,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: a.pointsGranted });
      setPointUserId(""); setPointAmount(""); setPointReason("");
      qc.invalidateQueries({ queryKey: ["admin-points"] });
    },
    onError: (e: Error) => toast({ title: a.error, description: e.message, variant: "destructive" }),
  });

  const deletePoint = useMutation({
    mutationFn: async (id: number) => { const { error } = await supabase.from("points").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => {
      toast({ title: a.pointDeleted });
      qc.invalidateQueries({ queryKey: ["admin-points"] });
    },
    onError: (e: Error) => toast({ title: a.deleteFailed, description: e.message, variant: "destructive" }),
  });

  if (loading || roleLoading) return <div className="p-8 text-center text-sm text-muted-foreground">{a.loading}</div>;
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center gap-3">
        <ShieldAlert className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{a.adminRequired}</p>
        <Button variant="outline" onClick={() => navigate("/")}>{a.home}</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md pb-10">
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="h-9 w-9 rounded-full hover:bg-muted flex items-center justify-center" aria-label="뒤로">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-base font-bold flex-1">{a.title}</h1>
        </header>

        <Tabs defaultValue="stats" className="p-4">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stats">{a.stats}</TabsTrigger>
            <TabsTrigger value="reports">{a.reports}</TabsTrigger>
            <TabsTrigger value="manage">{a.manage}</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-4 grid grid-cols-2 gap-2">
            {[
              { icon: UsersIcon, label: a.totalUsers, value: stats?.users, color: "bg-primary-soft text-primary" },
              { icon: UsersIcon, label: a.groups, value: stats?.groups, color: "bg-accent/10 text-accent" },
              { icon: BookOpen, label: a.classes, value: stats?.classes, color: "bg-secondary text-secondary-foreground" },
              { icon: MessageSquare, label: a.dms, value: stats?.dms, color: "bg-muted text-foreground" },
            ].map((s, i) => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${s.color}`}><s.icon className="h-4 w-4" /></div>
                <p className="text-2xl font-bold mt-2">{s.value ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
            <div className="col-span-2 bg-card rounded-2xl p-3 border border-border mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-primary" />{a.trend}
                </h3>
                <div className="flex gap-1">
                  {([7, 30, 90] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setRangeDays(d)}
                      className={`text-[11px] px-2 py-1 rounded-md ${rangeDays === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                    >{d}{a.days}</button>
                  ))}
                </div>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend ?? []} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g-users" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g-groups" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#g-users)" name={a.signups} />
                    <Area type="monotone" dataKey="groups" stroke="hsl(var(--accent))" fill="url(#g-groups)" name={a.groups} />
                    <Area type="monotone" dataKey="reports" stroke="hsl(var(--destructive))" fill="transparent" name={a.reports} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-2 bg-card rounded-2xl p-3 border border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Download className="h-4 w-4 text-primary" />{a.csvExport}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("profiles").select("id,email,name,nickname,location,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `users_${rangeDays}d.csv`);
                }}>{a.users}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("groups").select("id,name,category,location,owner_id,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `groups_${rangeDays}d.csv`);
                }}>{a.groups}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("reports").select("id,reporter_id,target_type,target_id,reason,status,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `reports_${rangeDays}d.csv`);
                }}>{a.reports}</Button>
                <Button size="sm" variant="outline" onClick={async () => {
                  const { data } = await supabase.from("classes").select("id,title,category,instructor_id,price,status,created_at").gte("created_at", sinceIso).limit(5000);
                  exportCsv(data ?? [], `classes_${rangeDays}d.csv`);
                }}>{a.classes}</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-2 mt-4">
            {reports?.length ? reports.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-destructive" />
                  <Badge variant={r.status === "pending" ? "secondary" : "outline"}>{statusLabel(r.status)}</Badge>
                  <Badge variant="outline" className="ml-auto">{displayText(r.target_type, lang)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{a.reporter}: {r.reporter_id}</p>
                <p className="text-xs text-muted-foreground">{a.target}: {r.target_id}</p>
                <p className="text-sm mt-1 whitespace-pre-line">{displayText(r.reason, lang)}</p>
                {r.status === "pending" && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => updateReport.mutate({ id: r.id, status: "resolved" })}>{a.resolve}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateReport.mutate({ id: r.id, status: "rejected" })}>{a.reject}</Button>
                  </div>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{a.noReports}</p>}
          </TabsContent>

          <TabsContent value="manage" className="mt-4">
            <Tabs defaultValue="instructors">
              <TabsList className="flex w-full overflow-x-auto gap-0.5 h-auto p-1">
                <TabsTrigger value="instructors" className="flex-shrink-0 text-xs px-3 py-1.5">{a.instructor}</TabsTrigger>
                <TabsTrigger value="ads" className="flex-shrink-0 text-xs px-3 py-1.5">{a.ads}</TabsTrigger>
                <TabsTrigger value="banners" className="flex-shrink-0 text-xs px-3 py-1.5">{a.banners}</TabsTrigger>
                <TabsTrigger value="roles" className="flex-shrink-0 text-xs px-3 py-1.5">{a.roles}</TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0 text-xs px-3 py-1.5">{a.users}</TabsTrigger>
                <TabsTrigger value="groups" className="flex-shrink-0 text-xs px-3 py-1.5">{a.groups}</TabsTrigger>
                <TabsTrigger value="classes" className="flex-shrink-0 text-xs px-3 py-1.5">{a.classes}</TabsTrigger>
                <TabsTrigger value="points" className="flex-shrink-0 text-xs px-3 py-1.5">{a.points}</TabsTrigger>
              </TabsList>

          <TabsContent value="instructors" className="space-y-2 mt-4">
            {instructorApps?.length ? instructorApps.map((app) => (
              <div key={app.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{app.applicant_id}</p>
                  <Badge className="mt-1" variant={app.status === "pending" ? "secondary" : "outline"}>{statusLabel(app.status)}</Badge>
                </div>
                {app.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateApp.mutate({ id: app.id, status: "approved", applicantId: app.applicant_id })}>{a.approve}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateApp.mutate({ id: app.id, status: "rejected", applicantId: app.applicant_id })}>{a.decline}</Button>
                  </>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{a.noApplications}</p>}
          </TabsContent>

          <TabsContent value="ads" className="space-y-2 mt-4">
            {adRequests?.length ? adRequests.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.requester_id}</p>
                  <Badge className="mt-1" variant="secondary">{statusLabel(r.status)}</Badge>
                </div>
                {r.status === "pending" && (
                  <>
                    <Button size="sm" onClick={() => updateAd.mutate({ id: r.id, status: "approved", requesterId: r.requester_id })}>{a.approve}</Button>
                    <Button size="sm" variant="outline" onClick={() => updateAd.mutate({ id: r.id, status: "rejected", requesterId: r.requester_id })}>{a.decline}</Button>
                  </>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{a.noAdRequests}</p>}
          </TabsContent>

          <TabsContent value="banners" className="space-y-2 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold">{a.createBannerDirect}</p>
              <Input placeholder={a.bannerTitlePlaceholder} value={newBannerTitle} onChange={(e) => setNewBannerTitle(e.target.value)} />
              <Input placeholder={a.bannerImagePlaceholder} value={newBannerImageUrl} onChange={(e) => setNewBannerImageUrl(e.target.value)} />
              <label className="flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border text-xs font-medium text-muted-foreground hover:bg-muted">
                <Upload className="h-3.5 w-3.5" />
                {bannerUploading ? a.uploading : a.uploadImage}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadBannerImage(e.target.files?.[0] ?? null)} />
              </label>
              <Input placeholder={a.bannerLinkPlaceholder} value={newBannerLinkUrl} onChange={(e) => setNewBannerLinkUrl(e.target.value)} />
              <Input placeholder={a.bannerOrderPlaceholder} type="number" value={newBannerOrder} onChange={(e) => setNewBannerOrder(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => createBanner.mutate()} disabled={createBanner.isPending}>{a.createBanner}</Button>
            </div>
            {banners?.length ? banners.map((b) => (
              <div key={b.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
                {b.image_url && <img src={b.image_url} alt={b.title} className="h-12 w-12 rounded-lg object-cover" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{displayText(b.title, lang)}</p>
                  <p className="text-[11px] text-muted-foreground">{a.order} {b.order} · {displayText(b.type, lang)}</p>
                </div>
                <Button size="sm" variant={b.is_active ? "default" : "outline"} onClick={() => toggleBanner.mutate({ id: b.id, is_active: !b.is_active })}>
                  {b.is_active ? a.active : a.inactive}
                </Button>
                <Button size="sm" variant="outline" onClick={() => removeBanner.mutate(b.id)} className="text-destructive">{a.delete}</Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-4">{a.noBanners}</p>}
          </TabsContent>

          <TabsContent value="roles" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold">{a.grantRole}</p>
              <Input placeholder="user_id (UUID)" value={grantId} onChange={(e) => setGrantId(e.target.value)} />
              <div className="flex gap-2">
                {(["admin", "instructor", "member"] as const).map((r) => (
                  <button key={r} onClick={() => setGrantRole(r)} className={`flex-1 py-1.5 rounded-md text-xs font-medium ${grantRole === r ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{roleLabel(r)}</button>
                ))}
              </div>
              <Button size="sm" className="w-full" onClick={() => grantRoleMut.mutate()} disabled={grantRoleMut.isPending}>{a.grant}</Button>
            </div>
            {roles?.length ? roles.map((r) => (
              <div key={r.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.user_id}</p>
                  <Badge className="mt-1">{roleLabel(r.role)}</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-destructive" onClick={() => revokeRole.mutate(r.id)}>{a.revoke}</Button>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-6">{a.noRoles}</p>}
          </TabsContent>

          <TabsContent value="users" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={a.userSearchPlaceholder}
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
            </div>
            {userSearch.trim().length >= 2 ? (
              foundUsers && foundUsers.length > 0 ? (
                foundUsers.map((u) => (
                  <div key={u.id} className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-start gap-2">
                      <div className="h-9 w-9 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(u.nickname ?? u.first_name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono text-muted-foreground/80 truncate">{a.col_id}: {u.id}</p>
                        <p className="text-sm font-semibold truncate mt-0.5">{u.nickname ?? [u.first_name, u.last_name].filter(Boolean).join(" ") ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline">{roleLabel(u.role)}</Badge>
                          <Badge variant={u.show_groups === false ? "secondary" : "outline"}>{u.show_groups === false ? a.groupsHidden : a.groupsVisible}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => navigate(`/users/${u.id}`)} className="flex-1">{a.profile}</Button>
                      <Button size="sm" variant="outline" onClick={() => { setGrantId(u.id); toast({ title: a.roleFormAdded }); }} className="gap-1">
                        <UserCog className="h-3.5 w-3.5" />{a.roles}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => grantRoleToUser.mutate({ userId: u.id, role: "admin" })} className="gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />{a.addAdmin}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateUserVisibility.mutate({ userId: u.id, showGroups: u.show_groups === false })}>
                        {u.show_groups === false ? a.groupsVisible : a.groupsHidden}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setPointUserId(u.id); toast({ title: a.pointFormAdded }); }} className="gap-1">
                        <Coins className="h-3.5 w-3.5" />{a.points}
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-6">{a.noSearchResults}</p>
              )
            ) : (
              <p className="text-center text-xs text-muted-foreground py-6">{a.enterSearch}</p>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input placeholder={a.groupSearchPlaceholder} value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} />
              </div>
            </div>
            {filteredGroups.length > 0 ? filteredGroups.map((g) => (
              <div key={g.id} className="bg-card rounded-xl p-3 border border-border space-y-3">
                {editingGroupId === g.id ? (
                  <div className="space-y-2">
                    <Input placeholder={a.groupName} value={groupDraft.name} onChange={(e) => setGroupDraft({ ...groupDraft, name: e.target.value })} />
                    <Input placeholder={a.category} value={groupDraft.category} onChange={(e) => setGroupDraft({ ...groupDraft, category: e.target.value })} />
                    <Input placeholder={a.location} value={groupDraft.location} onChange={(e) => setGroupDraft({ ...groupDraft, location: e.target.value })} />
                    <Input placeholder={a.capacity} type="number" value={groupDraft.max_members} onChange={(e) => setGroupDraft({ ...groupDraft, max_members: e.target.value })} />
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => updateGroup.mutate(g.id)}>{a.save}</Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditingGroupId(null)}>{a.cancel}</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{displayText(g.name, lang)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {displayText(g.category, lang)}
                          {g.location ? ` · ${displayText(g.location, lang)}` : ""}
                          {g.max_members ? ` · ${a.capacity} ${g.max_members}` : ""}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{g.id}</p>
                      </div>
                      <Badge variant={g.status === "active" ? "default" : "secondary"}>{statusLabel(g.status)}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingGroupId(g.id);
                        setGroupDraft({ name: g.name, category: g.category, location: g.location ?? "", max_members: g.max_members ? String(g.max_members) : "" });
                      }}>{a.edit}</Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => updateGroupStatus.mutate({ id: g.id, status: g.status === "active" ? "archived" : "active" })}
                      >
                        {g.status === "active" ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        {g.status === "active" ? a.archive : a.restore}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive gap-1"
                        onClick={() => { if (window.confirm(`"${displayText(g.name, lang)}" ${a.confirmDeleteGroup}`)) deleteGroup.mutate(g.id); }}
                        disabled={deleteGroup.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />{a.delete}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{a.noGroups}</p>}
          </TabsContent>

          <TabsContent value="classes" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-muted-foreground" />
                <Input placeholder={a.classSearchPlaceholder} value={classSearch} onChange={(e) => setClassSearch(e.target.value)} />
              </div>
            </div>
            {filteredClasses.length > 0 ? filteredClasses.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-3 border border-border space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{displayText(c.title, lang)}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {c.category ? displayText(c.category, lang) : a.uncategorized}
                      {c.location ? ` · ${displayText(c.location, lang)}` : ""}
                      {c.price ? ` · ${displayText(c.price, lang)}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 truncate mt-0.5">{a.instructorId} {c.instructor_id}</p>
                  </div>
                  <Badge variant={c.status === "approved" ? "default" : c.status === "pending" ? "secondary" : "outline"}>{statusLabel(c.status)}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => updateClassStatus.mutate({ id: c.id, status: "approved" })}>
                    <CheckCircle2 className="h-3.5 w-3.5" />{a.approve}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => updateClassStatus.mutate({ id: c.id, status: "rejected" })}>
                    <XCircle className="h-3.5 w-3.5" />{a.decline}
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => updateClassStatus.mutate({ id: c.id, status: "pending" })}>{a.pending}</Button>
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder={a.adminNote}
                    value={classNoteDraft[c.id] ?? c.admin_note ?? ""}
                    onChange={(e) => setClassNoteDraft({ ...classNoteDraft, [c.id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => saveClassNote.mutate(c.id)}>{a.saveNote}</Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive gap-1"
                      onClick={() => { if (window.confirm(`"${displayText(c.title, lang)}" ${a.confirmDeleteClass}`)) deleteClass.mutate(c.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />{a.delete}
                    </Button>
                  </div>
                </div>
              </div>
            )) : <p className="text-center text-sm text-muted-foreground py-8">{a.noClasses}</p>}
          </TabsContent>

          <TabsContent value="points" className="space-y-3 mt-4">
            <div className="bg-card rounded-xl p-3 border border-border space-y-2">
              <p className="text-sm font-semibold flex items-center gap-1.5"><Coins className="h-4 w-4 text-primary" />{a.grantPoints}</p>
              <Input placeholder={a.pointUserPlaceholder} value={pointUserId} onChange={(e) => setPointUserId(e.target.value)} />
              <Input placeholder={a.pointAmountPlaceholder} type="number" value={pointAmount} onChange={(e) => setPointAmount(e.target.value)} />
              <Input placeholder={a.pointReasonPlaceholder} value={pointReason} onChange={(e) => setPointReason(e.target.value)} />
              <Button size="sm" className="w-full" onClick={() => grantPoints.mutate()} disabled={grantPoints.isPending}>{a.submitGrant}</Button>
            </div>
            <p className="text-xs text-muted-foreground text-center px-2">{a.pointHelp}</p>
            <div className="space-y-2">
              <p className="text-sm font-semibold">{a.recentPoints}</p>
              {pointHistory?.length ? pointHistory.map((p) => (
                <div key={p.id} className="bg-card rounded-xl p-3 border border-border flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${p.amount >= 0 ? "text-primary" : "text-destructive"}`}>{p.amount >= 0 ? "+" : ""}{p.amount.toLocaleString()}P</p>
                    <p className="text-[11px] text-muted-foreground truncate">{displayText(p.description ?? p.type, lang)}</p>
                    <p className="text-[10px] text-muted-foreground/60 truncate">{p.user_id}</p>
                  </div>
                  <Badge variant="outline">{displayText(p.type, lang)}</Badge>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => { if (window.confirm(a.confirmDeletePoint)) deletePoint.mutate(p.id); }}>{a.delete}</Button>
                </div>
              )) : <p className="text-center text-sm text-muted-foreground py-6">{a.noPoints}</p>}
            </div>
          </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
