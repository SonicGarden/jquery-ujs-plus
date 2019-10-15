interface JQueryStatic {
  rails: any
}

(function ($) {
  const { allowAction } = $.rails;
  const origAllowAction = allowAction.bind($.rails);

  // NOTE: HTML5のvalidation でエラーのある場合に confirm ダイアログを表示するとネイティブのエラーメッセージが表示されない動作の改善
  // https://github.com/rails/jquery-ujs/blob/3bff9e049afcb38191c6eb470062b9e51f46e535/src/rails.js#L294
  // eslint-disable-next-line no-param-reassign
  $.rails.allowAction = (element: JQuery) => {
    if ($(element).is('input[type="submit"],button[type="submit"]')) {
      const form = element.closest('form').get(0) as HTMLFormElement;
      if (form && form.checkValidity && !form.checkValidity()) {
        return true;
      }
    }

    return origAllowAction(element);
  };

  // NOTE: remote: true でファイルアップロードも有効に
  const handleRemote = (form: HTMLFormElement) => {
    const formData = new FormData(form);
    // NOTE: IEのバグ対策
    // https://blog.yorkxin.org/2014/02/06/ajax-with-formdata-is-broken-on-ie10-ie11
    formData.append('_file_upload', '1');

    // NOTE: jquery-ujs で13ミリ秒後に無効→有効となった後に再度無効化
    // https://github.com/rails/jquery-ujs/blob/3bff9e049afcb38191c6eb470062b9e51f46e535/src/rails.js#L507
    setTimeout(() => {
      $.rails.disableFormElements($(form));
    }, 20);

    const dataType = form.dataset.type || ($.ajaxSettings && $.ajaxSettings.dataType);

    $.ajax({
      dataType,
      type: form.method || 'POST',
      url: form.action,
      data: formData,
      processData: false,
      contentType: false,
      beforeSend: (xhr, settings) => {
        if (settings.dataType === undefined && settings.accepts) {
          xhr.setRequestHeader('accept', '*/*;q=0.5, ' + settings.accepts.script);
        }
        if ($.rails.fire(form, 'ajax:beforeSend', [xhr, settings])) {
          $(form).trigger('ajax:send', xhr);
        } else {
          return false;
        }
      },
    })
      .done((...args: any) => {
        $(form).trigger('ajax:success', args);
      })
      .fail((...args: any) => {
        $(form).trigger('ajax:error', args);
      })
      .always((...args: any) => {
        $(form).trigger('ajax:complete', args);
      });
  };

  $(document).on('ajax:aborted:file', 'form', ({ currentTarget }: { currentTarget: HTMLFormElement}) => {
    handleRemote(currentTarget);
    return false;
  });
}(jQuery));
