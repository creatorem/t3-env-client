import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const envs = createEnv({
        client: {
            NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),
            NEXT_PUBLIC_CREATOREM_URL: z.string().min(1),
            NEXT_PUBLIC_MARKETING_URL: z.string().min(1),
            NEXT_PUBLIC_GITHUB_REPO_LINK: z.string().optional(),
            NEXT_PUBLIC_STRIPE_PRODUCT_REPO_ACCESS: z.string().min(1),
        },
        server: {
            NOTION_POSTS_DB_ID: z.string().min(1),
            NOTION_ROADMAP_DB_ID: z.string().min(1),
            NOTION_INTEGRATION_SECRET: z.string().min(1),
            GITHUB_TOKEN: z.string().min(1),
            GITHUB_REPO_OWNER: z.string().min(1),
            GITHUB_REPO_NAME: z.string().min(1),
            AUTH_WEBHOOK_SECRET: z.string().min(1),
            GITHUB_PROJECT_OWNER: z.string().min(1),
            GITHUB_PROJECT_REPOSITORY: z.string().min(1),
            GITHUB_APP_ID: z.string().min(1),
            GITHUB_APP_PRIVATE_KEY: z.string().min(1),
            GITHUB_MODIFIED_TIME_TOKEN: z.string().min(1),
        },
        runtimeEnv: process.env as any,
        emptyStringAsUndefined: true,
    });
