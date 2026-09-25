import "server-only";

import { cache } from "react";

import { getCurrentMember } from "@/lib/member";

/**
 * The layout and each account page both need the member; caching per request
 * keeps that to one Supabase round trip.
 */
export const getAccountMember = cache(getCurrentMember);
