import { Card } from '@/shared/ui'
import styles from './AboutPage.module.css'
import { developers } from './developers'

export default function AboutPage() {
  return (
    <section className={styles.page}>
      <h1 className={styles.title}>Команда разработчиков SkillSwap</h1>

      <div className={styles.cards}>
        {developers.map((developer) => (
          <Card key={developer.github} className={styles.card}>
            <div className={styles.developerHeader}>
              <img
                src={developer.avatar}
                alt={`Фото разработчика ${developer.name}`}
                className={styles.avatar}
              />

              <div className={styles.developerInfo}>
                <h2 className={styles.name}>{developer.name}</h2>
                <p className={styles.role}>Роль в проекте: {developer.role}</p>
              </div>
            </div>

            <div className={styles.about}>
              <h3 className={styles.sectionTitle}>Обо мне:</h3>
              <p className={styles.description}>{developer.about}</p>
            </div>

            <div className={styles.contact}>
              <h3 className={styles.sectionTitle}>Связаться со мной:</h3>

              <a
                href={developer.github}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubLink}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.13c-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.24 3.33.95.1-.74.4-1.24.72-1.52-2.55-.29-5.23-1.27-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.14 1.18A10.9 10.9 0 0 1 12 6.12c.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.68 5.38-5.24 5.67.41.35.77 1.04.77 2.1v3.15c0 .3.21.65.79.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
                </svg>
                {developer.github}
              </a>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
