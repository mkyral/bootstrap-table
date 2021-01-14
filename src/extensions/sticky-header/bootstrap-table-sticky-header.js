/**
 * @author vincent loh <vincent.ml@gmail.com>
 * @update J Manuel Corona <jmcg92@gmail.com>
 * @update zhixin wen <wenzhixin2010@gmail.com>
 */

const Utils = $.fn.bootstrapTable.utils

$.extend($.fn.bootstrapTable.defaults, {
  stickyHeader: false,
  stickyHeaderOffsetY: 0,
  stickyHeaderOffsetLeft: 0,
  stickyHeaderOffsetRight: 0,
  stickyHeaderEnvelope: 'window'
})

$.BootstrapTable = class extends $.BootstrapTable {
  initHeader (...args) {
    super.initHeader(...args)

    if (!this.options.stickyHeader) {
      return
    }

    this.$tableBody.find('.sticky-header-container,.sticky_anchor_begin,.sticky_anchor_end').remove()

    this.$el.before('<div class="sticky-header-container"></div>')
    this.$el.before('<div class="sticky_anchor_begin"></div>')
    this.$el.after('<div class="sticky_anchor_end"></div>')
    this.$header.addClass('sticky-header')

    // clone header just once, to be used as sticky header
    // deep clone header, using source header affects tbody>td width
    this.$stickyContainer = this.$tableBody.find('.sticky-header-container')
    this.$stickyBegin = this.$tableBody.find('.sticky_anchor_begin')
    this.$stickyEnd = this.$tableBody.find('.sticky_anchor_end')
    this.$stickyHeader = this.$header.clone(true, true)

    // render sticky on window scroll or resize
    const resizeEvent = Utils.getEventName('resize.sticky-header-table', this.$el.attr('id'))
    const scrollEvent = Utils.getEventName('scroll.sticky-header-table', this.$el.attr('id'))

    $(window).off(resizeEvent).on(resizeEvent, () => this.renderStickyHeader())
    $(this.options.stickyHeaderEnvelope).off(scrollEvent).on(scrollEvent, () => this.renderStickyHeader())
    this.$tableBody.off('scroll').on('scroll', () => this.shMatchPositionX())
  }

  onColumnSearch ({ currentTarget, keyCode }) {
    super.onColumnSearch({ currentTarget, keyCode })
    this.renderStickyHeader()
  }

  resetView (...args) {
    super.resetView(...args)

    $('.bootstrap-table.fullscreen').off('scroll')
      .on('scroll', () => this.renderStickyHeader())
  }

  horizontalScroll () {
    super.horizontalScroll()
    if (this.options.stickyHeaderEnvelope === 'window') {
      this.$tableBody.on('scroll', () => this.shMatchPositionX())
    } else {
      $(this.options.stickyHeaderEnvelope).on('scroll', () => this.shMatchPositionX())
    }
  }

  renderStickyHeader () {
    const that = this

    this.$stickyHeader = this.$header.clone(true, true)

    if (this.options.filterControl) {
      $(this.$stickyHeader).off('keyup change mouseup').on('keyup change mouse', function (e) {
        const $target = $(e.target)
        const value = $target.val()
        const field = $target.parents('th').data('field')
        const $coreTh = that.$header.find(`th[data-field="${ field }"]`)

        if ($target.is('input')) {
          $coreTh.find('input').val(value)
        } else if ($target.is('select')) {
          const $select = $coreTh.find('select')

          $select.find('option[selected]').removeAttr('selected')
          $select.find(`option[value="${ value }"]`).attr('selected', true)
        }

        that.triggerSearch()
      })
    }

    // Get element to use
    const mainElement = (this.options.stickyHeaderEnvelope === 'window' ? this.$tableBody : $(this.options.stickyHeaderEnvelope))

    const top = mainElement.scrollTop()
    // top anchor scroll position, minus header height
    const start = this.$stickyBegin.offset().top - this.options.stickyHeaderOffsetY + (this.options.stickyHeaderEnvelope === 'window' ? 0 : $(this.options.stickyHeaderEnvelope).offset().top)
    // bottom anchor scroll position, minus header height, minus sticky height
    const end = this.$stickyEnd.offset().top - this.options.stickyHeaderOffsetY - this.$header.height()

    // element width
    let elWidth = mainElement.width()

    // table width
    const tblWidth = this.$tableBody.width()

    // Table is narrower than page
    let narrower = false

    if (tblWidth < elWidth) {
      elWidth = tblWidth
      narrower = true
    }

    const maxScrollLeft = mainElement.get(0).scrollWidth - mainElement.get(0).clientWidth

    const elXPosition = mainElement.scrollLeft()

    // show sticky when top anchor touches header, and when bottom anchor not exceeded
    if ((this.options.stickyHeaderEnvelope === window && top > start && top <= end) ||
        (top > start)) {
      // ensure clone and source column widths are the same
      this.$stickyHeader.find('tr').each(ridx => {
        this.$stickyHeader.find(''.concat('tr:eq(', ridx, ')')).find('th').each((index, el) => {
          $(el).css('min-width', this.$header.find(''.concat('tr:eq(', ridx, ')')).find('th').eq(index).css('width'))
        })
      })
      // match bootstrap table style
      this.$stickyContainer.show().addClass('fix-sticky fixed-table-container')
      // stick it in position
      let stickyHeaderOffsetLeft
      let stickyHeaderOffsetRight
      let stickyHeaderwidth = elWidth

      if (this.$el.closest('.bootstrap-table').hasClass('fullscreen')) {
        stickyHeaderOffsetLeft = 0
        stickyHeaderOffsetRight = 0
      } else if (elXPosition === 0) { // no scroll
        stickyHeaderOffsetLeft = this.options.stickyHeaderOffsetLeft
        stickyHeaderOffsetRight = 0
        stickyHeaderwidth = elWidth - this.options.stickyHeaderOffsetLeft - this.options.stickyHeaderOffsetRight
      } else if (elXPosition === maxScrollLeft) { // max scroll
        stickyHeaderOffsetLeft = 0
        stickyHeaderOffsetRight = this.options.stickyHeaderOffsetRight
        stickyHeaderwidth = elWidth - this.options.stickyHeaderOffsetLeft - this.options.stickyHeaderOffsetRight
      } else if (elXPosition < this.options.stickyHeaderOffsetLeft) { // small scroll - less than left offset
        stickyHeaderOffsetLeft = this.options.stickyHeaderOffsetLeft - elXPosition
        stickyHeaderOffsetRight = this.options.stickyHeaderOffsetRight
        stickyHeaderwidth = elWidth - stickyHeaderOffsetLeft - stickyHeaderOffsetRight
      } else if ((maxScrollLeft - elXPosition) < this.options.stickyHeaderOffsetRight) { // almost max scroll - less than rigt offset
        stickyHeaderOffsetLeft = 0
        stickyHeaderOffsetRight = this.options.stickyHeaderOffsetRight + this.options.stickyHeaderOffsetRight - (maxScrollLeft - elXPosition)
        stickyHeaderwidth = elWidth - stickyHeaderOffsetRight
      } else { // inside scroll - do not cover scrollbar
        stickyHeaderOffsetLeft = 0
        stickyHeaderOffsetRight = 0
        stickyHeaderwidth = elWidth - this.options.stickyHeaderOffsetRight
      }

      /*
      console.log({ elXPosition })
      console.log({ elWidth })
      console.log({ maxScrollLeft })
      console.log('stickyHeaderOffsetLeft: '.concat(this.options.stickyHeaderOffsetLeft))

      console.log({ stickyHeaderOffsetLeft })
      console.log({ stickyHeaderOffsetRight })
      console.log({ stickyHeaderwidth })
      */

      this.$stickyContainer.css('top', ''.concat(this.options.stickyHeaderOffsetY), 'px')
      this.$stickyContainer.css('left', ''.concat(stickyHeaderOffsetLeft, 'px'))
      this.$stickyContainer.css('right', ''.concat(stickyHeaderOffsetRight, 'px'))
      this.$stickyContainer.css('width', ''.concat((narrower ? elWidth : stickyHeaderwidth), 'px'))

      // create scrollable container for header
      this.$stickyTable = $('<table/>')
      this.$stickyTable.addClass(this.options.classes)
      // append cloned header to dom
      this.$stickyContainer.html(this.$stickyTable.append(this.$stickyHeader))
      // match clone and source header positions when left-right scroll
      this.shMatchPositionX()
    } else {
      this.$stickyContainer.removeClass('fix-sticky').hide()
    }
  }

  shMatchPositionX () {

    if (!this.options.stickyHeader) {
      return
    }

    this.$stickyContainer.scrollLeft((this.options.stickyHeaderEnvelope === 'window' ? this.$tableBody.scrollLeft() : $(this.options.stickyHeaderEnvelope).scrollLeft()) - this.options.stickyHeaderOffsetLeft)
  }
}
