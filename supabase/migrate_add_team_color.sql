-- Run this once against an existing Supabase project to add a color-code
-- assignment for checked-in teams (e.g. "Blue I"). Safe to run
-- more than once. Update the color list below once the real list is final
-- (also update TEAM_COLORS in js/colors.js to match).

alter table teams add column if not exists color text;

alter table teams drop constraint if exists teams_color_check;
alter table teams add constraint teams_color_check check (
  color is null or color in (
    'Lime Green', 'Lime Green I',
    'Yellow', 'Yellow I',
    'Apple Red', 'Apple Red I',
    'Magenta Red', 'Magenta Red I',
    'Orange', 'Orange I',
    'Blue', 'Blue I',
    'Pink', 'Pink I',
    'Purple', 'Purple I',
    'White', 'White I',
    'Tan', 'Tan I',
    'Black', 'Black I',
    'Light Pink', 'Light Pink I',
    'Silver', 'Silver I',
    'Gold', 'Gold I'
  )
);

create unique index if not exists teams_color_unique on teams (color) where color is not null;
