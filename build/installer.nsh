!macro preInit
  SetRegView 64
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\integrador_isat3"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\integrador_isat3"
  SetRegView 32
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\integrador_isat3"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "C:\integrador_isat3"
!macroend

#!macro customInit
#  nsExec::Exec '"C:\integrador_isat\Update.exe" --uninstall -s'
#  nsExec::Exec '"C:\integrador_isat2\Update.exe" --uninstall -s'
#  nsExec::Exec '"$LOCALAPPDATA\integrador_isat\Update.exe" --uninstall -s'
#  nsExec::Exec '"$LOCALAPPDATA\integrador_isat2\Update.exe" --uninstall -s'
#!macroend