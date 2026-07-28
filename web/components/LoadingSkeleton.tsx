import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const skeletonTheme = {
  baseColor: "#e5e8e2",
  highlightColor: "#f8f7f2",
  borderRadius: 8,
  duration: 1.25,
};

export function PageLoadingSkeleton() {
  return (
    <SkeletonTheme {...skeletonTheme}>
      <div className="route-skeleton" aria-busy="true" aria-live="polite">
        <span className="sr-only">Carregando conteúdo</span>
        <main className="page-shell skeleton-page" aria-hidden="true">
          <section className="skeleton-intro">
            <div>
              <Skeleton width={180} height={10} />
              <Skeleton className="skeleton-title" count={2} height={50} />
              <Skeleton count={2} height={15} />
            </div>
            <Skeleton height={190} borderRadius={16} />
          </section>
          <section className="skeleton-stat-grid">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="skeleton-stat" key={index}>
                <Skeleton width={80} height={34} />
                <Skeleton width="65%" height={11} />
              </div>
            ))}
          </section>
          <section className="skeleton-card-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="skeleton-card" key={index}>
                <Skeleton height={130} borderRadius={12} />
                <Skeleton width="70%" height={25} />
                <Skeleton count={2} height={11} />
              </div>
            ))}
          </section>
        </main>
      </div>
    </SkeletonTheme>
  );
}

export function ProfileLoadingSkeleton() {
  return (
    <SkeletonTheme {...skeletonTheme}>
      <div
        className="profile-loading-skeleton"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Carregando perfil Steam</span>
        <section className="profile-head" aria-hidden="true">
          <Skeleton circle width={120} height={120} />
          <div>
            <Skeleton width={170} height={10} />
            <Skeleton width={320} height={52} />
            <Skeleton width={130} height={13} />
          </div>
        </section>
        <section className="profile-section" aria-hidden="true">
          <Skeleton width={190} height={34} />
          <div className="profile-submission-list">
            <div className="profile-submission-card">
              <div>
                <Skeleton width={120} height={10} />
                <Skeleton width={230} height={30} />
                <Skeleton width="75%" height={13} />
              </div>
              <Skeleton width={120} height={48} borderRadius={9} />
            </div>
          </div>
        </section>
      </div>
    </SkeletonTheme>
  );
}
