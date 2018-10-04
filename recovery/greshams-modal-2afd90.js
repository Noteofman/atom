function createEventModal(event) {
    MicroModal.show('event-modal');
    jQuery('#modal-1-title').html(event.title);
    jQuery('#modal-1-content').html(event.description);
    jQuery('#modal-1-date').html(event.start_date.formatted);
    jQuery('#modal-1-venue').html(event.venue_name);
    jQuery('.book-now-btn').on('click', null, event, function(e) {
        var iframe = document.getElementById('redirect-iframe');
        iframe.src = baseUrl.replace(/\/$/, "") + '/' + 'e/' + event.id + '/embed';
        MicroModal.close('event-modal');
        MicroModal.show('redirect-modal');
    });
}
