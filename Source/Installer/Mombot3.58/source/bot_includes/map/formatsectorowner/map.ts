
:formatsectorowner
			setvar $most_recent_data false
			setvar $datetime date&" "&time
			if ($datetime = SECTOR.UPDATED[$adj_sec])
				setvar $most_recent_data true
			end
			if ($most_recent_data = true)
				if ((($adjSectorOwner = "belong to your Corp") OR ($adjSectorOwner = "yours")) AND (SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0))
					setSectorParameter $adj_sec "FIGSEC" TRUE
					setvar $isFigged true
				else
					setSectorParameter $adj_sec "FIGSEC" FALSE
					setvar $isFigged false
				end
				if ((SECTOR.ANOMOLY[$ADJ_SEC] = true) and ((($adjLimpOwner = "belong to your Corp") or ($adjLimpOwner = "yours")) AND (SECTOR.LIMPETS.QUANTITY[$ADJ_SEC] > 0)))
					setSectorParameter $adj_sec "LIMPSEC" TRUE
					setvar $isLimped true
				else
					setSectorParameter $adj_sec "LIMPSEC" FALSE
					setvar $isLimped false
				end
				if ((($adjMineOwner = "belong to your Corp") or ($adjMineOwner = "yours")) AND (SECTOR.MINES.QUANTITY[$ADJ_SEC] > 0))
					setSectorParameter $adj_sec "MINESEC" TRUE
				else
					setSectorParameter $adj_sec "MINESEC" FALSE
				end

			end
			if (($isFigged = true) OR (($adjSectorOwner = "belong to your Corp") OR ($adjSectorOwner = "yours")) AND (SECTOR.FIGS.QUANTITY[$ADJ_SEC] > 0))
				setvar $text "OURS"
				setvar $color ansi_14
			else
				getWord $adjSectorOwner $alienCheck 1
				if (($ADJ_SEC < 11) OR ($ADJ_SEC = $stardock))
					setvar $color ansi_9
					setvar $text "FEDSPACE" 
				elseif ($ADJ_SEC = $rylos)
					setvar $color ansi_9
					setvar $text "RYLOS" 
				elseif ($ADJ_SEC = $alpha_centauri)
					setvar $color ansi_9
					setvar $text "ALPHA" 
				elseif ($adjSectorOwner = "Rogue Mercenaries")
					setvar $color ansi_7
					setvar $text "ROGUE" 
				elseif ($alienCheck = "the")
					setvar $color ansi_2
					setvar $text "ALIEN" 
					setvar $isaliens true
				elseif ($alienCheck = "The")
					setvar $color ansi_2
					setvar $text "ALIEN" 
					setvar $isaliens true
				elseif (($adjSectorOwner <> "") AND ($adjSectorOwner <> "Unknown"))
					setVar $heads TRUE
					getWord $adjSectorOwner $temp 3
					stripText $temp ","
					upperCase $temp
					setvar $text $temp
					setvar $color ansi_12
				else
					setvar $text "NONE"
					setvar $color ansi_13
				end
			end
			setvar $temp $text
			getLength $temp $tempLength
			setvar $length 10
			if ($tempLength >= $length)
				cutText $temp $temp 1 $length
			else
				while (($length - $tempLength) > 0)
					if ($heads)
						setVar $temp $temp&" "
						setVar $heads FALSE
					else
						setVar $temp " "&$temp
						setVar $heads TRUE
					end
					getLength $temp $tempLength
				end
			end
return