:gameprefs~setgameprefs



















































send "cn"
waiton "<Set ANSI and misc settings>"
settextlinetrigger LIBSILENT :ANSI "ANSI graphics"
settextlinetrigger ANIMATION :ANIMATION "Animation display"
settextlinetrigger PAGEMESSAGES :PAGEMESSAGES "Page on messages"
settextlinetrigger SUBSPACE :SUBSPACE "Sub-space radio channel"
settextlinetrigger FEDCOM :FEDCOM "Federation comm-link"
settextlinetrigger HAILS :HAILS "Receive private hails"
settextlinetrigger SILENCEMESSAGES :SILENCEMESSAGES "Silence ALL messages"
settextlinetrigger ABORTDISPLAYALL :ABORTDISPLAYALL "Abort display on keys"
settextlinetrigger MESSAGEDISPLAYLONG :MESSAGEDISPLAYLONG "Message Display Mode"
settextlinetrigger SCREENPAUSES :SCREENPAUSES "Screen Pauses"
settextlinetrigger AUTOFLEE :AUTOFLEE "Online Auto Flee"
settexttrigger DISPLAYDONE :DISPLAYDONE "Settings command (?=Help)"
pause
:gameprefs~ansi

getword CURRENTLINE $gameprefs~oldansi 5
uppercase $gameprefs~oldansi
pause
:gameprefs~animation

getword CURRENTLINE $gameprefs~oldanimation 5
uppercase $gameprefs~oldanimation
pause
:gameprefs~pagemessages

getword CURRENTLINE $gameprefs~oldpagemessages 6
uppercase $gameprefs~oldpagemessages
pause
:gameprefs~subspace

getword CURRENTLINE $gameprefs~oldsubspace 6
pause
:gameprefs~fedcom

getword CURRENTLINE $gameprefs~oldfedcom 5
uppercase $gameprefs~oldfedcom
pause
:gameprefs~hails

getword CURRENTLINE $gameprefs~oldhails 6
uppercase $gameprefs~oldhails
pause
:gameprefs~silencemessages

getword CURRENTLINE $gameprefs~oldsilencemessages 6
if ($gameprefs~oldsilencemessages = "No")
  setvar $gameprefs~oldsilencemessages "OFF"
else
  setvar $gameprefs~oldsilencemessages "ON"
end
pause
:gameprefs~abortdisplayall

getword CURRENTLINE $gameprefs~oldabortdisplayall 7
if ($gameprefs~oldabortdisplayall = "SPACE")
  setvar $gameprefs~oldabortdisplayall "OFF"
else
  setvar $gameprefs~oldabortdisplayall "ON"
end
pause
:gameprefs~messagedisplaylong

getword CURRENTLINE $gameprefs~oldmessagedisplaylong 6
if ($gameprefs~oldmessagedisplaylong = "Compact")
  setvar $gameprefs~oldmessagedisplaylong "OFF"
else
  setvar $gameprefs~oldmessagedisplaylong "ON"
end
pause
:gameprefs~screenpauses

getword CURRENTLINE $gameprefs~oldscreenpauses 5
if ($gameprefs~oldscreenpauses = "No")
  setvar $gameprefs~oldscreenpauses "OFF"
else

  setvar $gameprefs~oldscreenpauses "ON"
end
pause
:gameprefs~autoflee

getword CURRENTLINE $gameprefs~oldautoflee 6
if ($gameprefs~oldautoflee = "No")
  setvar $gameprefs~oldautoflee "OFF"
else
  setvar $gameprefs~oldautoflee "ON"
end
pause
:gameprefs~displaydone

killtrigger LIBSILENT
killtrigger ANIMATION
killtrigger PAGEMESSAGES
killtrigger SUBSPACE
killtrigger FEDCOM
killtrigger HAILS
killtrigger SILENCEMESSAGES
killtrigger ABORTDISPLAYALL
killtrigger MESSAGEDISPLAYLONG
killtrigger SCREENPAUSES
killtrigger AUTOFLEE



setvar $gameprefs~send ""

if (($gameprefs~ansi[$gameprefs~bank] <> $gameprefs~oldansi) and ($gameprefs~ansi[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"1  "
  setvar $gameprefs~ansi[$gameprefs~bank] $gameprefs~oldansi
end
if (($gameprefs~animation[$gameprefs~bank] <> $gameprefs~oldanimation) and ($gameprefs~animation[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"2  "
  setvar $gameprefs~animation[$gameprefs~bank] $gameprefs~oldanimation
end
if (($gameprefs~pagemessages[$gameprefs~bank] <> $gameprefs~oldpagemessages) and ($gameprefs~pagemessages[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"3  "
  setvar $gameprefs~pagemessages[$gameprefs~bank] $gameprefs~oldpagemessages
end
if (($gameprefs~subspace[$gameprefs~bank] <> $gameprefs~oldsubspace) and ($gameprefs~subspace[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&4&$gameprefs~subspace[$gameprefs~bank]&"*"
  setvar $gameprefs~subspace[$gameprefs~bank] $gameprefs~oldsubspace
end
if (($gameprefs~fedcom[$gameprefs~bank] <> $gameprefs~oldfedcom) and ($gameprefs~fedcom[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"5  "
  setvar $gameprefs~fedcom[$gameprefs~bank] $gameprefs~oldfedcom
end
if (($gameprefs~hails[$gameprefs~bank] <> $gameprefs~oldhails) and ($gameprefs~hails[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"6  "
  setvar $gameprefs~hails[$gameprefs~bank] $gameprefs~oldhails
end
if (($gameprefs~silencemessages[$gameprefs~bank] <> $gameprefs~oldsilencemessages) and ($gameprefs~silencemessages[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"7  "
  setvar $gameprefs~silencemessages[$gameprefs~bank] $gameprefs~oldsilencemessages
end
if (($gameprefs~abortdisplayall[$gameprefs~bank] <> $gameprefs~oldabortdisplayall) and ($gameprefs~abortdisplayall[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"9  "
  setvar $gameprefs~abortdisplayall[$gameprefs~bank] $gameprefs~oldabortdisplayall
end
if (($gameprefs~messagedisplaylong[$gameprefs~bank] <> $gameprefs~oldmessagedisplaylong) and ($gameprefs~messagedisplaylong[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"a  "
  setvar $gameprefs~messagedisplaylong[$gameprefs~bank] $gameprefs~oldmessagedisplaylong
end
if (($gameprefs~screenpauses[$gameprefs~bank] <> $gameprefs~oldscreenpauses) and ($gameprefs~screenpauses[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"b  "
  setvar $gameprefs~screenpauses[$gameprefs~bank] $gameprefs~oldscreenpauses
end
if (($gameprefs~autoflee[$gameprefs~bank] <> $gameprefs~oldautoflee) and ($gameprefs~autoflee[$gameprefs~bank] <> 0))
  setvar $gameprefs~send $gameprefs~send&"c  "
  setvar $gameprefs~autoflee[$gameprefs~bank] $gameprefs~oldautoflee
end

send $gameprefs~send "qq"
return
