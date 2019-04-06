
$(function() {
  $('a.confirmDeletion').on('click', () => {
    if(!confirm('Confirm Deletion'))
      return false;
  })

  if ($('textarea#ta').length) {
    CKEDITOR.replace('ta');
}

  if ($("[data-fancybox]").length) {
      $("[data-fancybox]").fancybox();
  }

  $('tbody#page-list').sortable({

    items: "tr:not('.home')",
    placeholder: "ui-state-highlight",
    update: function () {
        var ids = $('tbody#page-list').sortable("serialize");
        var url = "/admin/pages/reorder-pages";
        
        $.post(url, ids);
    }
  
  });
  

})



