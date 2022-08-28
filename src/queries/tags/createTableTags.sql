CREATE TABLE IF NOT EXISTS tags
(
    uuid       TEXT PRIMARY KEY NOT NULL,
    taskUuid   TEXT             NOT NULL,
    name       TEXT             NOT NULL,
    color      TEXT             NOT NULL DEFAULT 'red',
    created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskUuid) REFERENCES tasks (uuid)
)

-- TODO make name UNIQUE for each user, but this requires a refactoring, because it would currently prevent another user from creating the same tag. Same todo for tasks