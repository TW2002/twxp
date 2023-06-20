:helpfile
setvar $only_help false
if (($parm1 = "help") or ($parm1 = "?"))
	setvar $only_help true
end
if (($switchboard~self_command <> false) and (($bot~parm1 = "!") or ($bot~parm1 = "menu")))
	goto :self_menu
end
	setVar $help_file "scripts\"&$mombot_directory&"\help\"&$command&".txt"
	fileExists $doesHelpFileExist $help_file
	if ($doesHelpFileExist)
		setVar $i 1 
		read $help_file $help_line ($i+4)
		while ($help_line <> EOF)
			#echo "*[]"&$help[$i]&"[]<->*[]"&$help_line&"[]*"
			stripText $help[$i] #13
			stripText $help[$i] "`"
			stripText $help[$i] "'"
			#replaceText $help[$i] "=" "-"
			if ($help[$i] <> $help_line)
				goto :write_new_help_file
			end
			add $i 1
			read $help_file $help_line ($i+4)
		end
		if (($help[($i + 1)] <> "0") OR (($help[($i + 2)] <> "0")))
			goto :write_new_help_file
		end
		if ($only_help = true)
			gosub :displayhelp
			halt
		end
		return
	end
	:write_new_help_file
		delete $help_file
		setvar $i 1
		getLength $command $length
		setVar $spaces "                                            "
		setVar $stars "---------------------------------------------"
		setVar $pos ($length)
		cutText $stars $border 1 $pos
		setVar $pos ((50-($length+10))/2)
		cutText $spaces $center 1 $pos
		write $help_file "                     "
		write $help_file "   "
		write $help_file $center&"<<<< "&$command&" >>>>" 
		write $help_file "   "
		while ($i <= $help)
			stripText $help[$i] #13
			stripText $help[$i] "`"
			stripText $help[$i] "'"
			#replaceText $help[$i] "=" "-"
			if ($help[$i] = "0")
				goto :done_help_file
			end
			write $help_file $help[$i]
			add $i 1
		end
		:done_help_file
			 setVar $SWITCHBOARD~message "Writing text file for "&$command&" in help directory.*"
			 gosub :SWITCHBOARD~switchboard

		if ($only_help = true)
			gosub :displayhelp
			halt
		end
		:self_menu
			setvar $i 1
			if (($switchboard~self_command <> false) and (($bot~parm1 = "!") or ($bot~parm1 = "menu")))
				setarray $fields 100 5
				setvar $fields 0
				setvar $field_count 0
				setvar $isDone false
				setvar $topOfFile true
				while (($i <= $help) and ($isDone <> true)) 
					if ($help[$i] <> "0")
						stripText $help[$i] #13
						stripText $help[$i] "`"
						stripText $help[$i] "'"
						#############################################################
						# Grid defender {f|l|a} {auto} {holo} {mines} {extern:11pm} #
						#############################################################
						setvar $check_for_blank_line $help[$i]
						trim $check_for_blank_line
						if ($check_for_blank_line = "")
							setvar $topOfFile false
						else
							if ($topOfFile = true)
								# create field types and grab script name #
								if ($i = 1)
									getwordpos $help[$i] $pos "{"
									cuttext $help[$i] $menu_title 1 $pos
									cuttext $help[$i] $rest_of_string $pos 9999
								else
									setvar $rest_of_string $help[$i]
								end
								getText $rest_of_string $option "{" "}"
								while ($option <> "")
									###########################################
									# remove the option found from the string #
									###########################################
									getwordpos $rest_of_string $pos "}"
									cuttext $rest_of_string&"     " $rest_of_string ($pos+1) 9999

									replacetext $option "{" ""
									replacetext $option "}" ""
									getwordpos $option $pos "|"
									
									add $field_count 1

									if ($pos > 0)
										setvar $field_type "multi"
										setvar $field_name $option
										splitText $field_name $options "|"
										# grab first option as default #
										setvar $fields[$field_count][2] $options[1]
									else
										getwordpos $option $pos ":"
										getwordpos $option $pos2 #34
										if (($pos > 0) or ($pos2 > 0))
											getwordpos $option $pos ":#"
											if ($pos > 0)
												setvar $field_type "number"
												setvar $fields[$field_count][2] 0
											else
												getwordpos $option $pos #34
												if ($pos > 0)
													# mark as double quoted string #
													setvar $fields[$field_count][5] true
												end
												setvar $field_type "string"
												setvar $fields[$field_count][2] ""
											end
											splitText $option $inputs ":"
											setvar $field_name $option
										else
											setvar $field_type "boolean"
											setvar $field_name $option
											setvar $fields[$field_count][2] false
										end 
									end
									setvar $fields[$field_count] $field_name
									setvar $fields[$field_count][1] $field_type
									#echo "adding field: [" $fields[$field_count] "] with value of [" $fields[$field_count][2] "]*"
									add $fields 1
									########################
									# grab the next option #
									########################
									getText $rest_of_string $option "{" "}"
								end
							else
								getwordpos $help[$i] $pos "{"
								if ($pos > 0)
									#######################################
									# define field types and descriptions #
									#######################################

									##################################################
									#  {adjacent} - adjacent photon option (default) #
									##################################################

									getWord $help[$i] $option 1
									replacetext $option "{" ""
									replacetext $option "}" ""
									trim $option 
									getwordpos $help[$i] $pos "}"
									cuttext $help[$i] $help[$i] $pos 9999
									replacetext $help[$i] "{" ""
									replacetext $help[$i] "}" ""
									replacetext $help[$i] "-" ""
									trim $help[$i]

									setvar $j 1 
									while ($j <= $fields)
										setvar $foundOption false
										getwordpos $fields[$j] $pos "|"
										if ($pos > 0)
											splitText $fields[$j] $options "|"
											setvar $k 1
											while ($k <= $options)
												trim $options[$k]
												if ($options[$k] = $option)
													if ($fields[$j][3] = "0")
														setvar $fields[$j][3] ""
													end
													setvar $fields[$j][3] $fields[$j][3]&$help[$i]&"|"
												end
												add $k 1
											end
										else
											#echo "[" $option "][" $fields[$j] "]*"
											if ($option = $fields[$j])
												setvar $fields[$j][3] $help[$i]
											end
										end
										add $j 1
									end
								else
									# ignore lines without {} in them #
								end

							end
						end
					else
						setvar $isDone true
					end
					add $i 1
				end

				setvar $command_display $command
				uppercase $command_display
				addMenu "" "MENUSYSTEM" ansi_15&":::  "&ansi_14&"["&ansi_15&"help - "&ansi_6&"+"&ansi_14&"]"&ansi_15&" -=[ "&ansi_6&$command_display&ansi_15&" ]=- "&ansi_14&"["&ansi_15&"refresh - "&ansi_6&"?"&ansi_14&"]"&ansi_15&"  ::" "." "" "Main" FALSE
				setMenuOptions "MENUSYSTEM" false false false
				
				setarray $menu_system_keys 33
				setvar $menu_system_keys 33
				setvar $menu_system_keys[1] 1
				setvar $menu_system_keys[2] 2
				setvar $menu_system_keys[3] 3
				setvar $menu_system_keys[4] 4
				setvar $menu_system_keys[5] 5
				setvar $menu_system_keys[6] 6
				setvar $menu_system_keys[7] 7
				setvar $menu_system_keys[8] 8
				setvar $menu_system_keys[9] 9
				setvar $menu_system_keys[10] "a"
				setvar $menu_system_keys[11] "b"
				setvar $menu_system_keys[12] "c"
				setvar $menu_system_keys[13] "d"
				setvar $menu_system_keys[14] "e"
				setvar $menu_system_keys[15] "f"
				setvar $menu_system_keys[16] "g"
				setvar $menu_system_keys[17] "h"
				setvar $menu_system_keys[18] "i"
				setvar $menu_system_keys[19] "j"
				setvar $menu_system_keys[20] "k"
				setvar $menu_system_keys[21] "l"
				setvar $menu_system_keys[22] "m"
				setvar $menu_system_keys[23] "n"
				setvar $menu_system_keys[24] "o"
				setvar $menu_system_keys[25] "p"
				setvar $menu_system_keys[26] "r"
				setvar $menu_system_keys[27] "s"
				setvar $menu_system_keys[28] "t"
				setvar $menu_system_keys[29] "u"
				setvar $menu_system_keys[30] "v"
				setvar $menu_system_keys[31] "w"
				setvar $menu_system_keys[32] "x"
				setvar $menu_system_keys[33] "y"

				setvar $longest 0
				setvar $i 1
				while ($i <= $fields)
					if ($fields[$i][1] = "multi")
						getlength "::select::" $length
					else
						getlength $fields[$i] $length
					end
					if ($length > $longest)
						setvar $longest $length
					end
					add $i 1
				end
				setvar $bot_to_control $bot_name
				setvar $menu_field_display "Start!"
				padright $menu_field_display $longest
				addMenu "MENUSYSTEM" Start ANSI_15&$menu_field_display "Z" :endMenuAndGo  "" FALSE
				setvar $menu_field_display "Bot"
				padright $menu_field_display $longest
				setvar $menu_field_display $menu_field_display&" "&ansi_14&":"&ansi_15&" "
				addMenu "MENUSYSTEM" Control ANSI_15&$menu_field_display "0" :changeBotName  $bot_to_control FALSE
				setvar $bot_to_control_display ansi_14&$bot_to_control
				padright $bot_to_control_display $longest
				setMenuValue Control $bot_to_control_display


				setvar $i 1
				setvar $field_padding 18
				while ($i <= $fields)
					setvar $extra $fields[$i][3]
					if ($fields[$i][1] = "boolean")					
						if ($fields[$i][2] = true)
							setvar $displayValue ansi_14&"On"
						else
							setvar $displayValue ansi_15&"Off"
						end
						padright $displayValue $field_padding
						setvar $displayValue $displayValue&$extra
					end
					if ($fields[$i][1] = "multi")
						splitText $fields[$i] $options "|"
						setvar $k 1
						while ($k <= $options)
							if ($options[$k] = $fields[$i][2])
								if ($k < $options)
									setvar $optionIndex $k
								else
									setvar $optionIndex 1
								end
								setvar $currentValue $options[$optionIndex]
								splitText $fields[$i][3] $descriptions "|"
							end
							add $k 1
						end
						setvar $extra ansi_15&"["&ansi_14&$descriptions[$optionIndex]&ansi_15&"]"&ansi_14
						setvar $displayValue ansi_14&$fields[$i][2]
						padright $displayValue $field_padding
						setvar $displayValue $displayValue&$extra
					end
					if ($fields[$i][1] = "string")
						setvar $displayValue $fields[$i][2]
						if ($displayValue = "")
							setvar $displayValue ansi_15&"Off"
						end
						padright $displayValue $field_padding
						setvar $displayValue $displayValue&$extra
					end
					if ($fields[$i][1] = "number")
						setvar $displayValue ansi_15&$fields[$i][2]
						padright $displayValue $field_padding
						setvar $displayValue $displayValue&$extra
					end

					if ($fields[$i][1] = "multi")
						setvar $menu_field_display "::select::"
					else
						setvar $menu_field_display $fields[$i]
					end
					padleft $menu_field_display $longest
					addMenu "MENUSYSTEM" $fields[$i] ANSI_11&$menu_field_display&ANSI_14&" : " $menu_system_keys[$i] ":"&$fields[$i][1]&"Field"&$i $fields[$i][3] FALSE
					setMenuValue $fields[$i] $displayValue
					setMenuHelp $fields[$i] $fields[$i][3]
					:menu_creation
					add $i 1
				end
				openMenu "MENUSYSTEM" true
				:endMenuAndGo
				closeMenu
				setvar $i 1
				setvar $parm_count 0 
				setvar $user_command_line ""
				while ($i <= $fields)
					trim $fields[$i][2]
					if ((($fields[$i][2] = "0")) or (($fields[$i][1] = "string") and ($fields[$i][2] = "")))
						#skip
					else
						if ($fields[$i][1] = "boolean")
							if ($fields[$i][2] = true)
								setvar $user_command_line $user_command_line&" "&$fields[$i]
								setvar $parm_value $fields[$i]
							end
						end
						if (($fields[$i][1] = "string") or ($fields[$i][1] = "number"))
							if ($fields[$i][5] = true)
								# marked as double quoted string #
								setvar $string_field #34&$fields[$i][2]&#34
							else
								splittext $fields[$i] $inputs ":"
								setvar $string_field $inputs[1]&":"&$fields[$i][2]
							end
							setvar $user_command_line $user_command_line&" "&$string_field
							setvar $parm_value $string_field
						end
						if ($fields[$i][1] = "multi")
							setvar $user_command_line $user_command_line&" "&$fields[$i][2]
							setvar $parm_value $fields[$i][2]
						end
						if ($parm_count <= 8)
							add $parm_count 1
							if ($parm_count = 1)
								setvar $parm1 $parm_value
							end
							if ($parm_count = 2)
								setvar $parm2 $parm_value
							end
							if ($parm_count = 3)
								setvar $parm3 $parm_value
							end
							if ($parm_count = 4)
								setvar $parm4 $parm_value
							end
							if ($parm_count = 5)
								setvar $parm5 $parm_value
							end
							if ($parm_count = 6)
								setvar $parm6 $parm_value
							end
							if ($parm_count = 7)
								setvar $parm7 $parm_value
							end
							if ($parm_count = 8)
								setvar $parm8 $parm_value
							end
						end
					end
					add $i 1
				end
				savevar $user_command_line
				savevar $parm1
				savevar $parm2
				savevar $parm3
				savevar $parm4
				savevar $parm5
				savevar $parm6
				savevar $parm7
				savevar $parm8
				trim $command
				trim $user_command_line
				if ($bot_name <> $bot_to_control)
					setvar $control_string "'"&$bot_to_control&" "&$command&" "&$user_command_line
					send $control_string&"*"
					loadVar $historyString
					setVar $history[1] $control_string
					setVar $historyString $history[1]&"<<|HS|>>"&$historyString
					saveVar $historyString
					halt
				else
					loadVar $historyString
					setVar $history[1] $command&" "&$user_command_line
					setVar $historyString $history[1]&"<<|HS|>>"&$historyString
					saveVar $historyString
				end
				#echo "Sending this command to the bot:" $user_command_line "*"
				#echo "Parameters:" $parm1 $parm2 $parm3 $parm4 $parm5 $parm6 $parm7 $parm8 "*"
			end
return

:booleanField1
	setvar $field_index 1
	goto :booleanField
:booleanField2
	setvar $field_index 2
	goto :booleanField
:booleanField3
	setvar $field_index 3
	goto :booleanField
:booleanField4
	setvar $field_index 4
	goto :booleanField
:booleanField5
	setvar $field_index 5
	goto :booleanField
:booleanField6
	setvar $field_index 6
	goto :booleanField
:booleanField7
	setvar $field_index 7
	goto :booleanField
:booleanField8
	setvar $field_index 8
	goto :booleanField
:booleanField9
	setvar $field_index 9
	goto :booleanField
:booleanField10
	setvar $field_index 10
	goto :booleanField
:booleanField11
	setvar $field_index 11
	goto :booleanField
:booleanField12
	setvar $field_index 12
	goto :booleanField
:booleanField13
	setvar $field_index 13
	goto :booleanField
:booleanField14
	setvar $field_index 14
	goto :booleanField
:booleanField15
	setvar $field_index 15
	goto :booleanField
:booleanField16
	setvar $field_index 16
	goto :booleanField
:booleanField17
	setvar $field_index 17
	goto :booleanField
:booleanField18
	setvar $field_index 18
	goto :booleanField
:booleanField19
	setvar $field_index 19
	goto :booleanField
:booleanField20
	setvar $field_index 20
	goto :booleanField
:booleanField21
	setvar $field_index 21
	goto :booleanField
:booleanField22
	setvar $field_index 22
	goto :booleanField
:booleanField23
	setvar $field_index 23
	goto :booleanField
:booleanField24
	setvar $field_index 24
	goto :booleanField
:booleanField25
	setvar $field_index 25
	goto :booleanField
:booleanField26
	setvar $field_index 26
	goto :booleanField
:booleanField27
	setvar $field_index 27
	goto :booleanField
:booleanField28
	setvar $field_index 28
	goto :booleanField
:booleanField29
	setvar $field_index 29
	goto :booleanField
:booleanField30
	setvar $field_index 30
:booleanField
	setvar $currentValue $fields[$field_index][2]
	if ($currentValue = false)
		setvar $currentValue true
		setvar $displayValue ansi_14&"On"
	else
		setvar $currentValue false
		setvar $displayValue ansi_15&"Off"
	end
	setvar $fields[$field_index][2] $currentValue
	setvar $extra $fields[$field_index][3]
	padright $displayValue $field_padding
	setvar $displayValue $displayValue&$extra
	setMenuValue $fields[$field_index] $displayValue
goto :menu_creation


:multiField1
	setvar $field_index 1
	goto :multiField
:multiField2
	setvar $field_index 2
	goto :multiField
:multiField3
	setvar $field_index 3
	goto :multiField
:multiField4
	setvar $field_index 4
	goto :multiField
:multiField5
	setvar $field_index 5
	goto :multiField
:multiField6
	setvar $field_index 6
	goto :multiField
:multiField7
	setvar $field_index 7
	goto :multiField
:multiField8
	setvar $field_index 8
	goto :multiField
:multiField9
	setvar $field_index 9
	goto :multiField
:multiField10
	setvar $field_index 10
	goto :multiField
:multiField11
	setvar $field_index 11
	goto :multiField
:multiField12
	setvar $field_index 12
	goto :multiField
:multiField13
	setvar $field_index 13
	goto :multiField
:multiField14
	setvar $field_index 14
	goto :multiField
:multiField15
	setvar $field_index 15
	goto :multiField
:multiField16
	setvar $field_index 16
	goto :multiField
:multiField17
	setvar $field_index 17
	goto :multiField
:multiField18
	setvar $field_index 18
	goto :multiField
:multiField19
	setvar $field_index 19
	goto :multiField
:multiField20
	setvar $field_index 20
	goto :multiField
:multiField21
	setvar $field_index 21
	goto :multiField
:multiField22
	setvar $field_index 22
	goto :multiField
:multiField23
	setvar $field_index 23
	goto :multiField
:multiField24
	setvar $field_index 24
	goto :multiField
:multiField25
	setvar $field_index 25
	goto :multiField
:multiField26
	setvar $field_index 26
	goto :multiField
:multiField27
	setvar $field_index 27
	goto :multiField
:multiField28
	setvar $field_index 28
	goto :multiField
:multiField29
	setvar $field_index 29
	goto :multiField
:multiField30
	setvar $field_index 30
:multiField
	splitText $fields[$field_index] $options "|"
	if ($options > 1)
		setvar $k 1
		while ($k <= $options)
			if ($options[$k] = $fields[$field_index][2])
				if ($k < $options)
					setvar $optionIndex ($k+1)
				else
					setvar $optionIndex 1
				end
				setvar $currentValue $options[$optionIndex]
				splitText $fields[$field_index][3] $descriptions "|"
				setvar $extra ansi_15&"["&ansi_14&$descriptions[$optionIndex]&ansi_15&"]"&ansi_14
				setvar $displayValue ansi_14&$currentValue
				padright $displayValue $field_padding
				setvar $displayValue $displayValue&$extra
			end
			add $k 1
		end

		setvar $fields[$field_index][2] $currentValue
		setMenuValue $fields[$field_index] $displayValue
	end

goto :menu_creation

:stringField1
	setvar $field_index 1
	goto :stringField
:stringField2
	setvar $field_index 2
	goto :stringField
:stringField3
	setvar $field_index 3
	goto :stringField
:stringField4
	setvar $field_index 4
	goto :stringField
:stringField5
	setvar $field_index 5
	goto :stringField
:stringField6
	setvar $field_index 6
	goto :stringField
:stringField7
	setvar $field_index 7
	goto :stringField
:stringField8
	setvar $field_index 8
	goto :stringField
:stringField9
	setvar $field_index 9
	goto :stringField
:stringField10
	setvar $field_index 10
	goto :stringField
:stringField11
	setvar $field_index 11
	goto :stringField
:stringField12
	setvar $field_index 12
	goto :stringField
:stringField13
	setvar $field_index 13
	goto :stringField
:stringField14
	setvar $field_index 14
	goto :stringField
:stringField15
	setvar $field_index 15
	goto :stringField
:stringField16
	setvar $field_index 16
	goto :stringField
:stringField17
	setvar $field_index 17
	goto :stringField
:stringField18
	setvar $field_index 18
	goto :stringField
:stringField19
	setvar $field_index 19
	goto :stringField
:stringField20
	setvar $field_index 20
	goto :stringField
:stringField21
	setvar $field_index 21
	goto :stringField
:stringField22
	setvar $field_index 22
	goto :stringField
:stringField23
	setvar $field_index 23
	goto :stringField
:stringField24
	setvar $field_index 24
	goto :stringField
:stringField25
	setvar $field_index 25
	goto :stringField
:stringField26
	setvar $field_index 26
	goto :stringField
:stringField27
	setvar $field_index 27
	goto :stringField
:stringField28
	setvar $field_index 28
	goto :stringField
:stringField29
	setvar $field_index 29
	goto :stringField
:stringField30
	setvar $field_index 30
:stringField

	getInput $displayValue "Please enter a value for "&$fields[$field_index]&"."
	setvar $fields[$field_index][2] $displayValue


	if ($displayValue = "")
		setvar $displayValue ansi_15&"Off"
	else
		setvar $displayValue ansi_14&$displayValue
	end
	setvar $extra $fields[$field_index][3]
	padright $displayValue $field_padding
	setvar $displayValue $displayValue&$extra

	setMenuValue $fields[$field_index] $displayValue
goto :menu_creation

:numberField1
	setvar $field_index 1
	goto :numberField
:numberField2
	setvar $field_index 2
	goto :numberField
:numberField3
	setvar $field_index 3
	goto :numberField
:numberField4
	setvar $field_index 4
	goto :numberField
:numberField5
	setvar $field_index 5
	goto :numberField
:numberField6
	setvar $field_index 6
	goto :numberField
:numberField7
	setvar $field_index 7
	goto :numberField
:numberField8
	setvar $field_index 8
	goto :numberField
:numberField9
	setvar $field_index 9
	goto :numberField
:numberField10
	setvar $field_index 10
	goto :numberField
:numberField11
	setvar $field_index 11
	goto :numberField
:numberField12
	setvar $field_index 12
	goto :numberField
:numberField13
	setvar $field_index 13
	goto :numberField
:numberField14
	setvar $field_index 14
	goto :numberField
:numberField15
	setvar $field_index 15
	goto :numberField
:numberField16
	setvar $field_index 16
	goto :numberField
:numberField17
	setvar $field_index 17
	goto :numberField
:numberField18
	setvar $field_index 18
	goto :numberField
:numberField19
	setvar $field_index 19
	goto :numberField
:numberField20
	setvar $field_index 20
	goto :numberField
:numberField21
	setvar $field_index 21
	goto :numberField
:numberField22
	setvar $field_index 22
	goto :numberField
:numberField23
	setvar $field_index 23
	goto :numberField
:numberField24
	setvar $field_index 24
	goto :numberField
:numberField25
	setvar $field_index 25
	goto :numberField
:numberField26
	setvar $field_index 26
	goto :numberField
:numberField27
	setvar $field_index 27
	goto :numberField
:numberField28
	setvar $field_index 28
	goto :numberField
:numberField29
	setvar $field_index 29
	goto :numberField
:numberField30
	setvar $field_index 30
:numberField

	getInput $displayValue "Please enter a value for "&$fields[$field_index]&"."
	isNumber $isNumber $displayValue
	if ($isNumber <> true)
		echo "*Please enter a number value.*"
		goto :numberField
	end
	setvar $fields[$field_index][2] $displayValue

	if ($displayValue = 0)
		setvar $displayValue ansi_15&$displayValue
	else
		setvar $displayValue ansi_14&$displayValue
	end
	setvar $extra $fields[$field_index][3]
	padright $displayValue $field_padding
	setvar $displayValue $displayValue&$extra

	setMenuValue $fields[$field_index] $displayValue

goto :menu_creation


:changeBotName
	getInput $bot_to_control "What bot are you trying to control?"


	if ($bot_to_control = "")
		setvar $bot_to_control $bot_name
		setvar $bot_to_control_display ansi_14&$bot_name
	else
		setvar $bot_to_control_display ansi_14&$bot_to_control
	end
	padright $bot_to_control_display $field_padding
	setMenuValue Control $bot_to_control_display
goto :menu_creation

include "source\module_includes\bot\displayhelp\bot"
include "source\bot_includes\switchboard"

