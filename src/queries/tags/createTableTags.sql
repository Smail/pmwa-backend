CREATE TABLE IF NOT EXISTS tags
(
    uuid       TEXT PRIMARY KEY NOT NULL,
    taskUuid   TEXT             NOT NULL,
    name       TEXT             NOT NULL,
    color      TEXT             NOT NULL DEFAULT 'red',
    created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskUuid) REFERENCES tasks (uuid)
)