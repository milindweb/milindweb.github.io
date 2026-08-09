// finance/js/finance-settings.js — settings view

function loadSettings() {
  google.script.run
    .withSuccessHandler(function(settings) {
      var fields = ['app_name','current_year','current_assessment_year'];
      var html = '';
      fields.forEach(function(f) {
        var val = settings[f] || '';
        html += '<div class="form-group"><label>' + f.replace(/_/g,' ') + '</label><input type="text" id="sfield-' + f + '" value="' + val + '"></div>';
      });
      document.getElementById('settingsFields').innerHTML = html;
    })
    .getSettings();
}

function saveSettings() {
  var fields = ['app_name','current_year','current_assessment_year'];
  var count = 0;
  fields.forEach(function(f) {
    var el = document.getElementById('sfield-' + f);
    if (el) {
      google.script.run
        .withSuccessHandler(function() { count++; if (count === fields.length) showToast('Settings saved', 'success'); })
        .saveSetting(f, el.value);
    }
  });
}

function changePwd() {
  showToast('Password is managed from your MilindWeb account', 'info');
}
