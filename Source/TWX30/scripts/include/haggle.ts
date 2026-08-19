:haggle~haggle


settextlinetrigger BUY :BUY "We are selling up to "
settextlinetrigger SELL :SELL "We are buying up to "
pause
:haggle~buy

killtrigger GETCREDITS
killtrigger DONE
settexttrigger ONHAND :BUYONHAND "]?"
pause
:haggle~buyonhand
getword CURRENTLINE $haggle~product 5
if ($haggle~product <> $haggle~buyprod)
  send "0*"
  settexttrigger GETCREDITS :GETCREDITS "empty cargo holds."
  pause
end
send "*"

settexttrigger GETCREDITS :GETCREDITS "empty cargo holds."
pause
:haggle~sell

killtrigger GETCREDITS
killtrigger DONE
send "*"

settexttrigger GETCREDITS :GETCREDITS "empty cargo holds."
pause
:haggle~getcredits

killtrigger BUY
killtrigger SELL
getword CURRENTLINE $haggle~credits 3
striptext $haggle~credits ","
settextlinetrigger BUY :BUY "We are selling up to "
settextlinetrigger SELL :SELL "We are buying up to "
settexttrigger DONE :DONE "Command [TL="
pause
:haggle~done

killtrigger BUY
killtrigger SELL
return
