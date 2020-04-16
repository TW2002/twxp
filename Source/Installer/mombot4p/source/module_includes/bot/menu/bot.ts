:menu

addMenu "" "ScriptMenu" ANSI_6&"["&ANSI_14&"Settings"&ANSI_6&"]"&ANSI_7 "." "" "Main" FALSE
setvar $i 1
while ($i <= $menu)
	if (($menu[$i] <> "0") and ($menu[$i] <> ""))
		setvar $display_menu $menu[$i]
		replacetext $menu[$i] " " "_"
		addMenu "ScriptMenu" $menu[$i]        ANSI_6&"["&ANSI_15&$display_menu&ANSI_6&"]                                 "&ANSI_7 "A" :menu_set         "" FALSE
		setMenuHelp $menu[$i] $menu[$i][1]
	end
	add $i 1
end
openMenu "ScriptMenu"



:menu_set
	pause
	openMenu "Menu"

return
