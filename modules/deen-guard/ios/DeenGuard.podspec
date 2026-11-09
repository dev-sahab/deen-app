Pod::Spec.new do |s|
  s.name           = 'DeenGuard'
  s.version        = '0.1.0'
  s.summary        = 'Deen App native guard module (silent mode / content filter)'
  s.description    = 'Deen App native guard module. iOS exposes capability flags only; see README.'
  s.license        = 'MIT'
  s.author         = 'Deen App'
  s.homepage       = 'https://github.com/'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.source_files = "**/*.{h,m,swift}"
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }
end
