import { st, type Lang } from "@/lib/site-i18n";
import { formatGameWhen } from "@/lib/games";
import type { SiteGame } from "@/lib/site-data";
import { youtubeEmbedUrl } from "@/lib/youtube";
import { ui } from "@/components/ui";
import AnnouncementBlock from "@/components/site/AnnouncementBlock";

// Презентаційна картка гри (серверкомпонент).
// headerActions — слот праворуч у хедері (кнопки запису/відписки/редагування, чек-ін).
// children — слот під розкривні налаштування поїздки (форма сама малює свій роздільник).
export default function GameCard({
  game,
  lang,
  muted = false,
  headerActions,
  children,
}: {
  game: SiteGame;
  lang: Lang;
  muted?: boolean;
  headerActions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const countText = game.capacity
    ? st(lang, "games_count_cap", { n: game.count, cap: game.capacity })
    : st(lang, "games_count", { n: game.count });
  // Посилання на відео локації → URL вбудованого програвача (null, якщо не YouTube/порожнє).
  const videoUrl = youtubeEmbedUrl(game.location?.youtube_url);

  return (
    <article className={`${ui.card} ${muted ? "opacity-75" : ""}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h3 className={`min-w-0 break-words ${ui.cardTitle}`}>{game.title ?? "ASG"}</h3>
          {game.showCount && <span className={`shrink-0 ${ui.muted}`}>{countText}</span>}
        </div>
        {headerActions && <div className="shrink-0">{headerActions}</div>}
      </div>

      {/* На телефоні лейбл стоїть НАД значенням (фікс-колонка w-20 з'являється лише з sm) —
          щоб довгі назви локацій не тиснулись у вузький ~210px стовпчик. */}
      <dl className="mt-3 space-y-1 text-sm text-gray-600">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-gray-400 sm:w-20 sm:shrink-0">{st(lang, "games_label_when")}</dt>
          <dd>{formatGameWhen(game.gather_at ?? game.start_at, lang)}</dd>
        </div>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
          <dt className="text-gray-400 sm:w-20 sm:shrink-0">{st(lang, "games_label_where")}</dt>
          <dd>
            {game.location?.name ?? st(lang, "games_tbd_loc")}
            {game.location?.map_url && (
              <>
                {" · "}
                <a
                  href={game.location.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ui.link}
                >
                  {st(lang, "games_map")}
                </a>
              </>
            )}
          </dd>
        </div>
      </dl>

      {game.announcement && <AnnouncementBlock text={game.announcement} lang={lang} />}

      {/* Вбудований YouTube-програвач із відео локації (16:9, lazy). */}
      {videoUrl && (
        <div className="mt-4">
          <p className={`mb-2 ${ui.muted}`}>{st(lang, "games_video")}</p>
          <iframe
            src={videoUrl}
            title={st(lang, "games_video")}
            className="aspect-video w-full rounded-lg border border-gray-200"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}

      {children}
    </article>
  );
}
