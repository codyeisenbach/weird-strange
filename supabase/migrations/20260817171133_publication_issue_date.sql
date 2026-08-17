-- Free-text issue date for a publication (e.g. "Nov 1942", "Fall 42",
-- "1942") -- deliberately unstructured/unvalidated, same convention as
-- artworks.placement. Lives on publications, not artworks, since one issue
-- can have multiple artworks (front/back cover) that should share a single
-- date rather than risk drifting apart if set independently per artwork.
alter table "public"."publications" add column "issue_date" text;
