import jqueryUjsInit from 'jquery-ujs';
export default function jqueryUjsPlusInit($) {
    jqueryUjsInit($);
    var allowAction = $.rails.allowAction;
    var origAllowAction = allowAction.bind($.rails);
    // NOTE: HTML5のvalidation でエラーのある場合に confirm ダイアログを表示するとネイティブのエラーメッセージが表示されない動作の改善
    // https://github.com/rails/jquery-ujs/blob/3bff9e049afcb38191c6eb470062b9e51f46e535/src/rails.js#L294
    // eslint-disable-next-line no-param-reassign
    $.rails.allowAction = function (element) {
        if ($(element).is('input[type="submit"],button[type="submit"]')) {
            var form = element.closest('form').get(0);
            if (form && form.checkValidity && !form.checkValidity()) {
                return true;
            }
        }
        return origAllowAction(element);
    };
    // NOTE: remote: true でファイルアップロードも有効に
    var handleRemote = function (form) {
        var formData = new FormData(form);
        // NOTE: IEのバグ対策
        // https://blog.yorkxin.org/2014/02/06/ajax-with-formdata-is-broken-on-ie10-ie11
        formData.append('_file_upload', '1');
        // NOTE: jquery-ujs で13ミリ秒後に無効→有効となった後に再度無効化
        // https://github.com/rails/jquery-ujs/blob/3bff9e049afcb38191c6eb470062b9e51f46e535/src/rails.js#L507
        setTimeout(function () {
            $.rails.disableFormElements($(form));
        }, 20);
        var dataType = form.dataset.type || ($.ajaxSettings && $.ajaxSettings.dataType);
        $.ajax({
            dataType: dataType,
            type: form.method || 'POST',
            url: form.action,
            data: formData,
            processData: false,
            contentType: false,
            beforeSend: function (xhr, settings) {
                if (settings.dataType === undefined && settings.accepts) {
                    xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
                }
                if ($.rails.fire($(form), 'ajax:beforeSend', [xhr, settings])) {
                    $(form).trigger('ajax:send', xhr);
                }
                else {
                    return false;
                }
            },
        })
            .done(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            $(form).trigger('ajax:success', args);
        })
            .fail(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            $(form).trigger('ajax:error', args);
        })
            .always(function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            $(form).trigger('ajax:complete', args);
        });
    };
    $(document).on('ajax:aborted:file', 'form', function (_a) {
        var currentTarget = _a.currentTarget;
        handleRemote(currentTarget);
        return false;
    });
}
