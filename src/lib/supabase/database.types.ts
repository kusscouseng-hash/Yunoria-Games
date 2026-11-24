/**
 * Datenbank-Typen (von Hand gepflegt, passend zu supabase/migrations).
 * Bei jeder neuen Migration hier ergänzen.
 */
export type RankSystemEnum = "hunter" | "cultivation" | "mage" | "knight";
export type SubscriptionTierEnum = "free" | "plus" | "premium";
export type UserRoleEnum = "user" | "moderator" | "admin";
export type WorkTypeEnum = "manga" | "manhwa" | "manhua" | "comic" | "novel";
export type WorkStatusEnum = "ongoing" | "completed" | "hiatus" | "cancelled";
export type RightsStatusEnum = "pending" | "approved" | "rejected";
export type LicenseTypeEnum =
  | "public_domain"
  | "cc_by"
  | "cc_by_sa"
  | "cc_by_nc"
  | "cc_by_nc_sa"
  | "permission"
  | "own_work"
  | "other";

type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type ProfileRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  rank_system: RankSystemEnum;
  total_xp: number;
  subscription_tier: SubscriptionTierEnum;
  role: UserRoleEnum;
  locale: string;
  terms_accepted_at: string | null;
  selected_title: string | null;
  is_owner?: boolean;
  is_creator?: boolean;
  created_at: string;
  updated_at: string;
};

export type ChapterTextRow = {
  chapter_id: string;
  language: string;
  pages: string[];
  word_count: number;
  created_at: string;
  updated_at: string;
};

export type GuildColor = "red" | "orange" | "amber" | "green" | "teal" | "blue" | "violet" | "pink";
export type GuildRole = "leader" | "officer" | "member";
export type GuildRow = {
  id: string;
  name: string;
  tag: string;
  description: string | null;
  emblem: string;
  color: GuildColor;
  image_url?: string | null;
  name_changed_at?: string | null;
  is_open: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};
export type GameProfileRow = { user_id: string; xp: number; rank_system: "league" | "arcade" | "ninja" | "space"; games_played: number; updated_at: string };
export type GameBestScoreRow = { user_id: string; game: string; score: number; achieved_at: string };
export type GameScoreEventRow = { id: number; user_id: string; game: string; score: number; duration_ms: number; xp: number; created_at: string };
export type GuildMemberRow = { guild_id: string; user_id: string; role: GuildRole; joined_at: string };
export type ActivityDayRow = { user_id: string; day: string; visits: number; last_visit: string };

export type GenreRow = { id: number; slug: string; name_en: string; name_de: string };

export type WorkRow = {
  id: string;
  slug: string;
  title: string;
  alt_titles: string[];
  type: WorkTypeEnum;
  status: WorkStatusEnum;
  description_en: string | null;
  description_de: string | null;
  author: string | null;
  artist: string | null;
  year: number | null;
  cover_path: string | null;
  external_url: string | null;
  external_platform: string | null;
  anilist_id: number | null;
  rights_status: RightsStatusEnum;
  is_published: boolean;
  published_at: string | null;
  created_by: string | null;
  /** Zeichner, dem das Werk gehört (Studio, Migration 14) */
  owner_id?: string | null;
  application_id?: string | null;
  /** Links des Zeichners (eine pro Zeile) */
  creator_links?: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkInsert = Partial<Omit<WorkRow, "id" | "created_at" | "updated_at" | "published_at">> &
  Pick<WorkRow, "slug" | "title" | "type">;

export type RightsRecordRow = {
  id: string;
  work_id: string;
  source_name: string;
  source_url: string | null;
  license_type: LicenseTypeEnum;
  license_url: string | null;
  attribution: string | null;
  commercial_ok: boolean;
  translation_ok: boolean;
  territories: string;
  proof_notes: string | null;
  checked_by: string | null;
  checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RightsRecordInsert = Partial<Omit<RightsRecordRow, "id" | "created_at" | "updated_at">> &
  Pick<RightsRecordRow, "work_id" | "source_name" | "license_type">;

export type WorkLicenseRow = Pick<
  RightsRecordRow,
  "work_id" | "license_type" | "license_url" | "attribution" | "source_name" | "source_url"
>;

export type ChapterRow = {
  id: string;
  work_id: string;
  number: number;
  title: string | null;
  page_count: number;
  languages: string[];
  credits: ChapterCredits;
  source_key: string | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Mitwirkende pro Rolle, z. B. { art: ["David Revoy"], translation: { de: ["…"] } } */
export type ChapterCredits = {
  art?: string[];
  scenario?: string[];
  translation?: Record<string, string[]>;
  proofreading?: Record<string, string[]>;
};

export type ChapterInsert = Partial<Omit<ChapterRow, "id" | "created_at" | "updated_at">> &
  Pick<ChapterRow, "work_id" | "number">;

export type ChapterPageRow = {
  id: number;
  chapter_id: string;
  language: string;
  page_number: number;
  storage_path: string;
  width: number | null;
  height: number | null;
};

export type ContentSourceRow = {
  id: string;
  work_id: string;
  kind: "peppercarrot" | "internet_archive" | "web";
  config: Record<string, unknown>;
  enabled: boolean;
  auto_publish: boolean;
  last_checked_at: string | null;
  last_status: "ok" | "error" | "review" | null;
  last_message: string | null;
  created_at: string;
};

export type ContentCandidateRow = {
  id: string;
  source: "internet_archive";
  external_id: string;
  title: string;
  creator: string | null;
  year: number | null;
  language: string | null;
  description: string | null;
  subjects: string[];
  page_count: number | null;
  license_url: string | null;
  license_type: LicenseTypeEnum | null;
  source_url: string;
  thumbnail_url: string | null;
  checks: CandidateChecks;
  verdict: "green" | "yellow" | "red";
  status: "new" | "approved" | "rejected";
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  work_id: string | null;
  found_at: string;
  updated_at: string;
};

/** Ergebnis der automatischen Prüfung eines Fundes */
export type CandidateChecks = {
  items: Array<{ ok: boolean | null; label: string }>;
  deathYear?: number | null;
  wikidata?: string | null;
};

export type ReadingProgressRow = {
  user_id: string;
  chapter_id: string;
  last_page: number;
  completed_at: string | null;
  updated_at: string;
};

export type ReactionKind = "like" | "smile" | "laugh" | "love" | "sad" | "angry";
export type CommentRow = { id: string; work_id: string; user_id: string; body: string; like_count: number; created_at: string; parent_id?: string | null };
export type ListStatus = "reading" | "completed" | "plan_to_read" | "on_hold" | "dropped";
export type CommentReportRow = {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: "spam" | "harassment" | "spoiler" | "illegal" | "other";
  note: string | null;
  status: "open" | "resolved";
  created_at: string;
};
export type CreatorApplicationRow = {
  id: string;
  creator_name: string;
  email: string;
  work_title: string;
  work_type: WorkTypeEnum;
  links: string;
  message: string | null;
  owns_rights: boolean;
  grants_license: boolean;
  status: "new" | "accepted" | "declined";
  admin_note: string | null;
  user_id: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        never,
        Partial<Pick<ProfileRow, "username" | "avatar_url" | "bio" | "rank_system" | "locale" | "role">>
      >;
      genres: Table<GenreRow, Omit<GenreRow, "id">, Partial<Omit<GenreRow, "id">>>;
      works: Table<WorkRow, WorkInsert, Partial<WorkInsert>>;
      work_genres: Table<{ work_id: string; genre_id: number }, { work_id: string; genre_id: number }, never>;
      rights_records: Table<RightsRecordRow, RightsRecordInsert, Partial<RightsRecordInsert>>;
      chapters: Table<ChapterRow, ChapterInsert, Partial<ChapterInsert>>;
      guilds: Table<GuildRow, never, never>;
      guild_members: Table<GuildMemberRow, never, never>;
      game_profiles: Table<GameProfileRow, never, never>;
      game_best_scores: Table<GameBestScoreRow, never, never>;
      game_score_events: Table<GameScoreEventRow, never, never>;
      user_activity_days: Table<ActivityDayRow, never, never>;
      chapter_texts: Table<ChapterTextRow, Omit<ChapterTextRow, "created_at" | "updated_at">, Partial<ChapterTextRow>>;
      chapter_pages: Table<ChapterPageRow, Omit<ChapterPageRow, "id">, Partial<Omit<ChapterPageRow, "id">>>;
      content_sources: Table<
        ContentSourceRow,
        Pick<ContentSourceRow, "work_id" | "kind"> & Partial<ContentSourceRow>,
        Partial<ContentSourceRow>
      >;
      reading_progress: Table<ReadingProgressRow, never, never>;
      profile_system_xp: Table<{ user_id: string; rank_system: RankSystemEnum; xp: number }, never, never>;
      content_candidates: Table<
        ContentCandidateRow,
        Pick<ContentCandidateRow, "source" | "external_id" | "title" | "source_url"> & Partial<ContentCandidateRow>,
        Partial<ContentCandidateRow>
      >;
      work_ratings: Table<
        { user_id: string; work_id: string; score: number; created_at: string; updated_at: string },
        { work_id: string; score: number },
        { score: number }
      >;
      bookmarks: Table<{ user_id: string; work_id: string; created_at: string }, { work_id: string }, never>;
      work_reactions: Table<
        { user_id: string; work_id: string; reaction: ReactionKind; created_at: string },
        { work_id: string; reaction: ReactionKind },
        { reaction: ReactionKind }
      >;
      comments: Table<CommentRow, { work_id: string; body: string; parent_id?: string | null }, never>;
      reading_lists: Table<
        { user_id: string; work_id: string; status: ListStatus; updated_at: string },
        { work_id: string; status: ListStatus },
        { status: ListStatus }
      >;
      comment_reports: Table<CommentReportRow, { comment_id: string; reason: CommentReportRow["reason"]; note?: string | null }, { status: "open" | "resolved" }>;
      comment_likes: Table<{ user_id: string; comment_id: string; created_at: string }, { comment_id: string }, never>;
      creator_applications: Table<
        CreatorApplicationRow,
        Omit<CreatorApplicationRow, "id" | "status" | "admin_note" | "created_at" | "user_id"> & { user_id?: string | null },
        Partial<Pick<CreatorApplicationRow, "status" | "admin_note">>
      >;
      reading_sessions: Table<{ user_id: string; chapter_id: string; opened_at: string }, never, never>;
      xp_events: Table<
        { id: number; user_id: string; chapter_id: string | null; amount: number; reason: string; created_at: string },
        never,
        never
      >;
    };
    Views: {
      work_licenses: { Row: WorkLicenseRow; Relationships: [] };
    };
    Functions: {
      submit_game_score: { Args: { p_game: string; p_score: number; p_duration_ms: number }; Returns: unknown };
      set_game_rank_system: { Args: { p_system: string }; Returns: undefined };
      my_game_stats: { Args: Record<string, never>; Returns: unknown };
      game_leaderboard: {
        Args: { p_period?: string; p_limit?: number };
        Returns: { place: number; user_id: string; username: string; avatar_url: string | null; role: string; rank_system: string; total_xp: number; xp: number }[];
      };
      game_top_scores: {
        Args: { p_game: string; p_period?: string; p_limit?: number };
        Returns: { place: number; user_id: string; username: string; avatar_url: string | null; score: number }[];
      };
      game_guild_leaderboard: {
        Args: { p_period?: string; p_limit?: number };
        Returns: { place: number; guild_id: string; name: string; tag: string; color: string; image_url: string | null; members: number; xp: number }[];
      };
      guild_min_level: { Args: Record<string, never>; Returns: number };
      create_guild: { Args: { p_name: string; p_tag: string; p_description: string | null; p_emblem: string | null; p_color: GuildColor | null }; Returns: string };
      join_guild: { Args: { p_guild: string }; Returns: undefined };
      leave_guild: { Args: Record<string, never>; Returns: undefined };
      kick_guild_member: { Args: { p_user: string }; Returns: undefined };
      set_guild_role: { Args: { p_user: string; p_role: "officer" | "member" }; Returns: undefined };
      rename_guild: { Args: { p_name: string }; Returns: undefined };
      update_guild: { Args: { p_description: string | null; p_emblem: string | null; p_color: GuildColor | null; p_is_open: boolean | null }; Returns: undefined };
      guild_leaderboard: {
        Args: { p_period?: string; p_limit?: number };
        Returns: { place: number; guild_id: string; name: string; tag: string; emblem: string; color: GuildColor; image_url?: string | null; members: number; xp: number }[];
      };
      guild_roster: {
        Args: { p_guild: string; p_period?: string };
        Returns: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          role: GuildRole;
          rank_system: RankSystemEnum;
          level_xp: number;
          selected_title: string | null;
          xp: number;
          joined_at: string;
        }[];
      };
      set_guild_image: { Args: { p_url: string | null }; Returns: undefined };
      admin_clear_guild_image: { Args: { p_guild: string }; Returns: undefined };
      record_activity: { Args: Record<string, never>; Returns: undefined };
      my_activity: { Args: { p_days?: number }; Returns: { day: string; visits: number; chapters: number }[] };
      username_available: { Args: { name: string }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      work_community_summary: {
        Args: { p_work: string };
        Returns: { rating_avg: number | null; rating_count: number; reactions: Partial<Record<ReactionKind, number>>; bookmark_count: number }[];
      };
      work_languages: { Args: Record<string, never>; Returns: { work_id: string; languages: string[] }[] };
      leaderboard: {
        Args: { p_period?: string; p_system?: RankSystemEnum | null; p_limit?: number };
        Returns: {
          place: number;
          user_id: string;
          username: string;
          avatar_url: string | null;
          rank_system: RankSystemEnum;
          level_xp: number;
          selected_title: string | null;
          role: UserRoleEnum;
          xp: number;
        }[];
      };
      my_leaderboard_position: {
        Args: { p_period?: string; p_system?: RankSystemEnum | null };
        Returns: { place: number; xp: number; total_players: number }[];
      };
      my_title_stats: { Args: Record<string, never>; Returns: { rank_system: RankSystemEnum; chapters: number; best_streak: number }[] };
      set_title: { Args: { p_title: string | null }; Returns: boolean };
      profile_stats: {
        Args: { p_user: string };
        Returns: { chapters_read: number; comments: number; ratings: number; best_streak: number; works_completed: number }[];
      };
      top_rated_works: {
        Args: { p_min_ratings?: number; p_limit?: number };
        Returns: { work_id: string; rating_avg: number; rating_count: number }[];
      };
      grant_creator: { Args: { p_application: string }; Returns: string };
      revoke_creator: { Args: { p_user: string }; Returns: undefined };
      work_stats_for_owner: {
        Args: { p_work: string };
        Returns: {
          views_total: number;
          views_7d: number;
          views_30d: number;
          rating_avg: number | null;
          rating_count: number;
          bookmarks: number;
          comments: number;
          readers: number;
          reactions: number;
        }[];
      };
      record_work_view: { Args: { p_work_id: string }; Returns: undefined };
      top_works: {
        Args: { p_days?: number | null; p_type?: WorkTypeEnum | null; p_limit?: number };
        Returns: { work_id: string; views: number }[];
      };
      latest_updated_works: {
        Args: { p_limit?: number };
        Returns: { work_id: string; last_chapter_at: string; last_chapter_number: number }[];
      };
      open_chapter: { Args: { p_chapter: string }; Returns: undefined };
      save_progress: { Args: { p_chapter: string; p_page: number }; Returns: undefined };
      complete_chapter: {
        Args: { p_chapter: string };
        Returns: { awarded: boolean; reason?: string; xp?: number; total_xp?: number; system_xp?: number; min_seconds?: number };
      };
    };
    Enums: {
      rank_system: RankSystemEnum;
      subscription_tier: SubscriptionTierEnum;
      user_role: UserRoleEnum;
      work_type: WorkTypeEnum;
      work_status: WorkStatusEnum;
      rights_status: RightsStatusEnum;
      license_type: LicenseTypeEnum;
    };
    CompositeTypes: Record<string, never>;
  };
};
