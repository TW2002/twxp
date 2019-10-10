# INCLUDE: Z_Dates 
#
# Copyright (c) 2012 by Archibald Horatio Vilanos III 
#
# Gosub :Z_Dates~DAYS 
# Gosub :Z_Dates~applyoffset 
# Gosub :Z_Dates~DOW 
#
# DAYS 
# SetVar $Z_Dates~date (format: d m yyyy h) (using GetTime) - OR 
#                               mm/dd/yy    from the Last Bust Clear Day (T-Menu) - OR 
#                               send the output from CT - OR 
#                               the output from SECTOR.UPDATED[x] 
# Returns $Z_Dates~days (Since 1/1/2008) 
# Returns $Z_Dates~hours (Since 1/1/2008) 
#
# Gosub :Z_Dates~DISPLAYTIME 
#
:DAYS
GetLength $date $dlen
GetWord $date $word2 2
GetWord $date $word3 3
If ($dlen = 8)
	ReplaceText $date "/" " "
	Getword $date $day 2
	Getword $date $month 1
	Getword $date $year 3

	GetTime $myyr "yyyy"
	If (($year + 2000) > ($myyr + 14))
		SetVar $year (($year + 2000) - 28)
	Else
		SetVar $year (($year + 2000) - 12)
	End
	
	SetVar $hour 0
ElseIf ($word3 = "AM") or ($word3 = "PM")
	ReplaceText $date "/" " "
	ReplaceText $date ":" " "
	Getword $date $day 1
	Getword $date $month 2
	Getword $date $year 3
	Getword $date $hour 4
	If ($word3 = "PM")
		SetVar $hour ($hour + 12)
	End
ElseIf ($word2 = "PM") or ($word2 = "AM")
	ReplaceText $date ":" " "
	ReplaceText $date "," " "
	GetWord $date $hour 1
	If ($Word2 = "PM") and ($hour < 12)
		SetVar $hour ($hour + 12)
	End
	If ($Word2 = "AM") and ($hour = 12)
		SetVar $hour 0
	End
	Getword $date $day 7
	Getword $date $year 8
	
	GetTime $myyr "yyyy"
	If ($year > ($myyr + 14))
		SetVar $year ($year - 28)
	Else
		SetVar $year ($year - 12)
	End
	
	Getword $date $mon 6
	SetArray $mons 12
	SetVar $mons 12
	SetVar $mons[1] "Jan"
	SetVar $mons[2] "Feb"
	SetVar $mons[3] "Mar"
	SetVar $mons[4] "Apr"
	SetVar $mons[5] "May"
	SetVar $mons[6] "Jun"
	SetVar $mons[7] "Jul"
	SetVar $mons[8] "Aug"
	SetVar $mons[9] "Sep"
	SetVar $mons[10] "Oct"
	SetVar $mons[11] "Nov"
	SetVar $mons[12] "Dec"
	SetVar $count 1
	While ($count <= $mons)
		If ($mons[$count] = $mon)
			SetVar $month $count
		End
		SetVar $count ($count + 1)
	End
	SetArray $mons 0
Else
	ReplaceText $date "/" " "
	ReplaceText $date ":" " "
	Getword $date $day 1
	Getword $date $month 2
	Getword $date $year 3
	Getword $date $hour 4
End
# ---changed to remove division for win 7 ----
SetVar $isaleap FALSE
SetVar $years ($year - 2008)
SetVar $leaptemp $years
SetVar $leapyears 1
While ($leaptemp > 0)
	SetVar $leaptemp ($leaptemp - 4)
	If ($leaptemp > 0)
		SetVar $leapyears ($leapyears + 1)
	ElseIf ($leaptemp = 0)
		SetVar $isaleap TRUE
		If ($month > 2)
			SetVar $leapyears ($leapyears + 1)
		End
	End
End
# SetPrecision 2
# SetVar $leaptemp ($year / 4)
# SetVar $leaptemp2 $leaptemp
# Round $leaptemp2 0
# If ($leaptemp = $leaptemp2)
# 	SetVar $isaleap TRUE
# Else
#	SetVar $isaleap FALSE
# End 
# SetPrecision 0
# SetVar $leapyears ((($years - 1) / 4) + 1)
# If ($isaleap = TRUE) and ($month > 2)
#	SetVar $leapyears ($leapyears + 1)
# End
# ---------------------------------------------
SetArray $daysofthemonth 12
SetVar $daysofthemonth[1] 31
SetVar $daysofthemonth[2] 28
SetVar $daysofthemonth[3] 31
SetVar $daysofthemonth[4] 30
SetVar $daysofthemonth[5] 31
SetVar $daysofthemonth[6] 30
SetVar $daysofthemonth[7] 31
SetVar $daysofthemonth[8] 31
SetVar $daysofthemonth[9] 30
SetVar $daysofthemonth[10] 31
SetVar $daysofthemonth[11] 30
SetVar $daysofthemonth[12] 31
SetVar $days (($years * 365) + $leapyears) 
SetVar $count 1
While ($count < $month)
	SetVar $days ($days + $daysofthemonth[$count])
	SetVar $count ($count + 1)
End
SetVar $days ($days + $day - 1)
SetVar $hours (($days * 24) + $hour)
SetArray $daysofthemonth 0
Return
# APPLYOFFSET 
# SetVar $Z_Dates~time (format: d m yyyy h offset) - offset should be hours (use a negative number to subtract) 
# Returns $z_dates~offsettime (format: d m yyyy h) 
:APPLYOFFSET
Getword $time $day 1
Getword $time $month 2
Getword $time $year 3
Getword $time $hour 4
GetWord $time $offset 5
# ---changed to remove division for win 7 ----
SetVar $isaleap FALSE
SetVar $years ($year - 2008) 
SetVar $leaptemp $years
While ($leaptemp > 0)
	SetVar $leaptemp ($leaptemp - 4)
	If ($leaptemp = 0)
		SetVar $isaleap TRUE
	End
End
# SetPrecision 2
# SetVar $leaptemp ($year / 4)
# SetVar $leaptemp2 $leaptemp
# Round $leaptemp2 0
# If ($leaptemp = $leaptemp2)
#	SetVar $isaleap TRUE
# Else
#	SetVar $isaleap FALSE
# End 
# SetPrecision 0
# --------------------------------------------
SetArray $daysofthemonth 12
SetVar $daysofthemonth[1] 31
If ($isaleap = TRUE)
	SetVar $daysofthemonth[2] 29
Else
	SetVar $daysofthemonth[2] 28
End
SetVar $daysofthemonth[3] 31
SetVar $daysofthemonth[4] 30
SetVar $daysofthemonth[5] 31
SetVar $daysofthemonth[6] 30
SetVar $daysofthemonth[7] 31
SetVar $daysofthemonth[8] 31
SetVar $daysofthemonth[9] 30
SetVar $daysofthemonth[10] 31
SetVar $daysofthemonth[11] 30
SetVar $daysofthemonth[12] 31
SetVar $hour ($hour + $offset)
If ($hour > 23)
	SetVar $hour ($hour - 24)
	SetVar $day ($day + 1)
	If ($day > $daysofthemonth[$month])
		SetVar $day 1
		SetVar $month ($month + 1)
		If ($month > 12)
			SetVar $month 1
			SetVar $year ($year + 1)
		End
	End
ElseIf ($hour < 0)
	SetVar $hour ($hour + 24)
	SetVar $day ($day - 1)
	If ($day < 1)
		If ($month > 1)
			SetVar $month ($month - 1)
			SetVar $day $daysofthemonth[$month]
		Else
			SetVar $year ($year - 1)
			SetVar $month 12
			SetVar $day 31
		End
	End
End
SetVar $offsettime $day & " " & $month & " " & $year & " " & $hour
SetArray $daysofthemonth 0
Return
# DOW 
# SetVar $Z_Dates~now (format: d m yyyy) (using GetTime) 
# Returns $Z_Dates~dow (Monday Tuesday etc) 
:DOW
SetArray $dowk 7
SetVar $dowk[1] "Tuesday"
SetVar $dowk[2] "Wednesday"
SetVar $dowk[3] "Thursday"
SetVar $dowk[4] "Friday"
SetVar $dowk[5] "Saturday"
SetVar $dowk[6] "Sunday"
SetVar $dowk[7] "Monday"

SetVar $date $now & " 0"
Gosub :DAYS
SetVar $dowdays $days
# ---changed to remove division for win 7 ----
While ($dowdays >= 7)
	If ($dowdays >=700)
		SetVar $dowdays ($dowdays - 700)
	ElseIf ($dowdays >=70)
		SetVar $dowdays ($dowdays - 70)
	Else
		SetVar $dowdays ($dowdays - 7)
	End
End
SetVar $dowdays ($dowdays + 1)
# SetVar $dayofweeknum (($dowdays - (($dowdays / 7) * 7)) + 1)
# --------------------------------------------
SetVar $dow $dowk[$dowdays]
SetArray $dowk 0
Return
# DISPLAYTIME 
:DISPLAYTIME
GetTime $currenttimeh "HH"
GetTime $currenttimem "nn"
GetTime $currenttimes "ss"
SetVar $cursor "[13D"
SetVar $currenttime $cursor & ANSI_12 & "[" & ANSI_15 & $currenttimeh & ANSI_12 & ":" & ANSI_15 & $currenttimem & ANSI_12 & ":" & ANSI_15 & $currenttimes & ANSI_12 & "] "
Echo $currenttime
Return
