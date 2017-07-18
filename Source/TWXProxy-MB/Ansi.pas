{
Copyright (C) 2005  Remco Mulder
}
unit Ansi;

// ANSI Code Constants

interface

const
  ANSI_0 = #27 + '[0m' + #27 + '[30m';
  ANSI_1 = #27 + '[0m' + #27 + '[34m';
  ANSI_2 = #27 + '[0m' + #27 + '[32m';
  ANSI_3 = #27 + '[0m' + #27 + '[36m';
  ANSI_4 = #27 + '[0m' + #27 + '[31m';
  ANSI_5 = #27 + '[0m' + #27 + '[35m';
  ANSI_6 = #27 + '[0m' + #27 + '[33m';
  ANSI_7 = #27 + '[0m' + #27 + '[37m';
  ANSI_8 = #27 + '[30;1m';
  ANSI_9 = #27 + '[34;1m';
  ANSI_10 = #27 + '[32;1m';
  ANSI_11 = #27 + '[36;1m';
  ANSI_12 = #27 + '[31;1m';
  ANSI_13 = #27 + '[35;1m';
  ANSI_14 = #27 + '[33;1m';
  ANSI_15 = #27 + '[37;1m';
  ANSI_CLEARLINE = #27 + '[K';
  ANSI_MOVEUP = #27 + '[1A';

implementation

end.
