proSSWarpSpec by Promethius
# Into the wild:  10/05/2008
# Please leave the above intact and
# if you make changes, please note them
# if you give this script out.

# Yes, a sysOp could modify this for use with an Ambassador
# account to provide an in-game warp spec to players.  If
# you do this, please be aware that it will give an
# advantage to experienced players and that new players
# will die quickly. A training game for new player might
# make use of it.

# setup an echo ANSI option
echo ANSI_11 "**-----------------------------------------------*"
echo ANSI_9 "*If more than one person is receiving this, have"
echo ANSI_9 "*all receivers fire up their script first.*"
echo ANSI_11 "*-----------------------------------------------*"
echo ANSI_10 "*Are you (" ANSI_15 "S" ANSI_10 ")ending or (" ANSI_15 "R" ANSI_10 ")eceiving the warp spec? s/r*"

# only want them to use a single key stroke to run this
getConsoleInput $sendReceive singlekey
# make sure we convert to lower case letters
lowerCase $sendReceive

if ($sendReceive = "r")
   goto :receive
elseif ($sendReceive = "s")
   goto :sender
end

# they entered a bad choice - kill the script (could just restart it)
echo ANSI_12 "**You did not enter S or R -- halting script!"
halt

:sender
send "'"
# setup triggers to make sure sub space is working
# a 3 second (3000 ms) delay trigger fires if there is a problem
setTextTrigger goodSenderRadio :goodSenderRadio "Sub-space radio"
setDelayTrigger badSenderRadio :badSenderRadio 3000
pause
:badSenderRadio
  # something is bad, halt the script
  echo ANSI_12 "*Something went wrong - no sub-space radio detected! Halting**"
  halt
:goodSenderRadio
killtrigger badSenderRadio
# send a SS text to make sure the receiver is ready
send "*ProSSWarpSpec v1.0 by Promethius*"
send "Waiting on Receiver script to fire.*"
# waiting on receiver's text
setTextTrigger receiverOn :receiverOn "ProWarpSpec Receiver Active"
setTextTrigger aborted :aborted "Sub-space comm-link terminated"
pause
:aborted
# ID10T error - they hit the enter key and aborted SS!!!
  echo ANSI_12 "**SS Link Terminated - Halting Script!**"
  halt
:receiverOn
killtrigger aborted
send "Receiver detected*"
setVar $i 1
setVar $keepAliveSend 1
   # doing a warp spec of 1 to the number of sectors in the game
while ($i <= sectors)
   getLength $i $len
    # a gosub to pad the string with so it formats 6 chars on each sector
   gosub :padLen
    # setup the string with a start point for the receiver's getText [++] and pad the sector
    setVar $warpString "[++] " & $i & $padIt
   setVar $warpCounter 1
   # see if the warp count of our starting sector is greater than 0
   if (sector.warpcount[$i] > 0)
      # we've got additional warps, need to get them
      while ($warpCounter <= sector.warpcount[$i])
         getLength sector.warps[$i][$warpCounter] $len
         gosub :padLen
         # combine our string and padded warp for SS send
         setVar $warpString $warpString & sector.warps[$i][$warpCounter] & $padIt
         add $warpCounter 1
      end
      # setup the string with an end point for the receiver's getText parsing
      send $warpString & " [--]*"
   end
   # increment our sector counter
   add $i 1
   # increment our keep the receiver alive counter so he doesn't time out
   add $keepaliveSend 1
   if ($keepaliveSend = 750)
      setVar $keepaliveSend 1
      # let's see if anyone is alive
      send "?Alive?*"
      setTextTrigger aliveRespond :aliveRespond "!Alive!"
      setDelayTrigger noOneAlive :noOneAlive 3000
      pause
      :noOneAlive
       # no one is there - exit SS and kill the script
       send "No one  is alive, killing script!**"
       halt
      :aliveRespond
      killtrigger noOneAlive
   end
end
send "ProWarpSpec Complete**"
halt


# this is the receiving corpie's code - they selected r at startup
:receive
# erase a previous warp spec of this name.  This could be stored to a variable.
delete gamename & "warpspec.txt"
send "'"
setTextTrigger goodReceiverRadio :goodReceiverRadio "Sub-space radio"
setDelayTrigger badReceiverRadio :badReceiverRadio 3000
pause
:badReceiverRadio
  echo ANSI_12 "*Something went wrong - no sub-space radio detected! Halting**"
  halt
:goodReceiverRadio
killtrigger badReceiverRadio
# send our announcement to the sender and wait for reply
send "'ProWarpSpec Receiver Active*"
# setup a trigger in case we started our script before the sender
setTextTrigger onFirst :onFirst "ProSSWarpSpec v1.0"
# receive a reply from the sender that he detected our announcement
setTextTrigger onSecond :onSecond "Receiver detected"
pause

:onFirst
killtrigger onSecond
send "'ProWarpSpec Receiver Active*"
goto :startReceiving
:onSecond
killtrigger onFirst

:startReceiving
  # setup our data completion, receiving, and keep alive triggers
  setTextTrigger done :done "ProWarpSpec Complete"
  setTextLineTrigger lineIn :lineIn "[++]"
  setTextTrigger receiveAlive :receiveAlive "?Alive?"
  pause
  :receiveAlive
   killtrigger done
   killtrigger lineIn
   send "'!Alive!*"
   goto :startReceiving
  :lineIn
   killtrigger done
   killtrigger receiveAlive
   # parse the sub-space message and write it to a file
   getText currentline $warps "[++] " " [--]"
   write gameName & "warpspec.txt" $warps
   goto :startReceiving
  :done
  send "'ProWarpSpec Receiver Complete*"
  echo ansi_12 "***Warp spec saved as: " gameName & "warpspec.txt"
  halt

# -=-=-= goSubs =-=-=-

# our padding routine
:padLen
setVar $padIt ""
while ($len < 6)
    setVar $padIt $padIt & " "
    add $len 1
end
return