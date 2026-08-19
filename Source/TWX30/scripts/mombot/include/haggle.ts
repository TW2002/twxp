:haggle~haggle
:haggle~starthaggle
#
# If defined, $haggle~buyprod will limit the routine to buying one of: Fuel, Organics, or Equipment.
# If not defined, the routine will attempt to buy any product that is offered.
#You have 11,511,493 credits and 147 empty cargo holds.
#
#We are buying up to 1940.  You have 108 in your holds.

waiton "Commerce report for"
settextlinetrigger sell :sell "We are buying up to "
settextlinetrigger buy :buy "We are selling up to "
settexttrigger done :done "Command [TL="
pause

:sell
killtrigger done
send "*"
if (haggle = false)
	setvar $firstoffer 0
	setvar $offerperc (1000 + $sellfactor[$sector])

	:sellreset
	killtrigger line
	killtrigger offer
	settextlinetrigger line :sellline
	settexttrigger offer :selloffer "Your offer ["
	pause

	:sellline
	getword currentline $test 1

	if ($test = 0)
		setvar $lastlineblank 1
	else
		setvar $lastlinkblank 0

		if (currentline = "We're not interested.")
			goto :abort
		else
			cuttext currentline $test 1 12

			if ($test = "Command [TL=")
				goto :done
			else
				cuttext currentline $test 1 9

				if ($test = "You have ")
					goto :selldone
				end
			end
		end
	end

	settextlinetrigger line :sellline
	pause

	:selloffer
	# get the first offer (if we don't have it)
	if ($firstoffer = 0)
		getword currentline $firstoffer 3
		striptext $firstoffer "["
		striptext $firstoffer "]"
		striptext $firstoffer ","
	end

	# calculate and make an offer
	setvar $offer $firstoffer
	multiply $offer $offerperc
	divide $offer 1000
	send $offer "*"
	if ($sellfactor[$sector] < 0)
		if ($selldone[$sector])
			add $offerperc 5
			add $sellfactor[$sector] 5
		else
			add $offerperc 10
			add $sellfactor[$sector] 10
		end
	else
		if ($selldone[$sector])
			subtract $offerperc 3
			subtract $sellfactor[$sector] 3
		else
			subtract $offerperc 10
			subtract $sellfactor[$sector] 10
		end
	end
	goto :sellreset

	:selldone
	# product sold, get credits
	getword currentline $test 3
	if ($test <> "been")
		setvar $credits $test
		striptext $credits ","
	end
	killtrigger offer
	killtrigger line
	setvar $selldone[$sector] 1
	if ($sellfactor[$sector] < 0)
		subtract $sellfactor[$sector] 4
	else
		add $sellfactor[$sector] 6
	end
end
settexttrigger done :done "Command [TL="
pause

:buy
killtrigger done

# make sure we're buying the right stuff
waiton "do you want to buy ["
getword currentline $product 5
if ($product <> $buyprod)
	send "0*"
	settextlinetrigger buy :buy "We are selling up to "
	settexttrigger done :done "Command [TL="
	pause
end

if ($quantity > 0)
	send $quantity "*"
else
	send "*"
end

if (haggle = false)
	setvar $firstoffer 0
	setvar $offerperc (1000 - $buyfactor[$sector])

	:buyreset
	killtrigger line
	killtrigger offer
	settextlinetrigger line :buyline
	settexttrigger offer :buyoffer "Your offer ["
	pause

	:buyline
	getword currentline $test 1

	if ($test = 0)
		setvar $lastlineblank 1
	else
		setvar $lastlinkblank 0

		if (currentline = "We're not interested.")
			goto :abort
		else
			cuttext currentline $test 1 12
			if ($test = "Command [TL=")
				goto :done
			else
				cuttext currentline $test 1 9

				if ($test = "You have ")
					goto :buydone
				end
			end
		end
	end

	settextlinetrigger line :buyline
	pause

	:buyoffer
	if ($lastlinkblank)
		# prompt display caused by a message
		settexttrigger offer :buyoffer "Your offer ["
		pause
	end

	# get the first offer (if we don't have it)
	if ($firstoffer = 0)
		getword currentline $firstoffer 3
		striptext $firstoffer "["
		striptext $firstoffer "]"
		striptext $firstoffer ","
	end

	# calculate and make an offer
	setvar $offer $firstoffer
	multiply $offer $offerperc
	divide $offer 1000
	send $offer "*"
	if ($buyfactor[$sector] < 0)
		if ($buydone[$sector])
			subtract $offerperc 5
			add $buyfactor[$sector] 5
		else
			subtract $offerperc 10
			add $buyfactor[$sector] 10
		end
	else
		if ($buydone[$sector])
			add $offerperc 3
			subtract $buyfactor[$sector] 3
		else
			add $offerperc 10
			subtract $buyfactor[$sector] 10
		end
	end
	goto :buyreset

	:buydone
	# product bought, get credits
	getword currentline $test 3
	if ($test <> "been")
		setvar $credits $test
		striptext $credits ","
	end
	killtrigger offer
	killtrigger line
	setvar $buydone[$sector] 1

	if ($buyfactor[$sector] < 0)
		subtract $buyfactor[$sector] 4
	else
		add $buyfactor[$sector] 6
	end
end

settextlinetrigger buy :buy "We are selling up to "
settexttrigger done :done "Command [TL="
pause

:abort
setvar $abort 1
killtrigger buy
killtrigger sell
killtrigger done
killtrigger line
killtrigger offer
settextlinetrigger buy :buy "We are selling up to "
settextlinetrigger sell :sell "We are buying up to "
settexttrigger done :done "Command [TL="
pause

:done
killtrigger abort
killtrigger sell
killtrigger buy
setvar $quantity 0
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:haggle~configurenativehaggle
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
setvar $restoreautohagglestate 0
if ($haggle~nativehagglemode = true)
	if (haggle = false)
		autohaggle on
		setvar $restoreautohagglestate 2
	end
else
	if (haggle)
		autohaggle off
		setvar $restoreautohagglestate 1
	end
end
return

#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
:haggle~restoreautohaggle
#-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
if ($restoreautohagglestate = 1)
	autohaggle on
else
	if ($restoreautohagglestate = 2)
		autohaggle off
	end
end
setvar $restoreautohagglestate 0
return
