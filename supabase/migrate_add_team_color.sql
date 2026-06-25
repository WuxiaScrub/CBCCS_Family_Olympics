-- Run this once against an existing Supabase project to add a color-code
-- assignment for checked-in teams (e.g. "Red I", "Teal II"). Safe to run
-- more than once. Update the color list below once the real list is final
-- (also update TEAM_COLORS in js/colors.js to match).

alter table teams add column if not exists color text;

alter table teams drop constraint if exists teams_color_check;
alter table teams add constraint teams_color_check check (
  color is null or color in (
    'Red I', 'Red II',
    'Blue I', 'Blue II',
    'Green I', 'Green II',
    'Yellow I', 'Yellow II',
    'Orange I', 'Orange II',
    'Purple I', 'Purple II',
    'Pink I', 'Pink II',
    'Teal I', 'Teal II',
    'Black I', 'Black II',
    'White I', 'White II'
  )
);

create unique index if not exists teams_color_unique on teams (color) where color is not null;
