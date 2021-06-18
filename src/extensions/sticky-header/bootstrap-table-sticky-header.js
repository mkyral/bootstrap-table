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

  getCaret (...args) {
    super.getCaret(...args)

    if (this.$stickyHeader) {
      const $ths = this.$stickyHeader.find('th')

      this.$header.find('th').each((i, th) => {
        $ths.eq(i).find('.sortable').attr('class', $(th).find('.sortable').attr('class'))
      })
    }
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
    if ((this.options.stickyHeaderEnvelope === 'window' && top > start && top <= end) ||
        (top > start)) {
      // ensure clone and source column widths are the same
      this.$stickyHeader.find('tr').each((indexRows, rows) => {
        const columns = $(rows).find('th')

        columns.each((indexColumns, celd) => {
          $(celd).css('min-width', this.$header.find(`tr:eq(${indexRows})`).find(`th:eq(${indexColumns})`).css('width'))
        })
      })
      // match bootstrap table style
      this.$stickyContainer.show().addClass('fix-sticky fixed-table-container')
      // stick it in position
      const coords = this.$tableBody[0].getBoundingClientRect()

      let stickyHeaderOffsetLeft = this.options.stickyHeaderOffsetLeft
      let stickyHeaderOffsetRight = this.options.stickyHeaderOffsetRight
      let stickyHeaderwidth

      if (!stickyHeaderOffsetLeft) {
        stickyHeaderOffsetLeft = coords.left
      }
      else {
        stickyHeaderOffsetLeft += coords.left
      }

      if (this.$el.closest('.bootstrap-table').hasClass('fullscreen')) {
        stickyHeaderOffsetLeft = 0
        stickyHeaderOffsetRight = 0
        stickyHeaderwidth = elWidth
      } else if (elXPosition === maxScrollLeft) { // max scroll
        stickyHeaderwidth = coords.width
      } else {
        stickyHeaderwidth = elWidth - stickyHeaderOffsetRight - stickyHeaderOffsetLeft
      }

      // console.log(`'stickyHeaderOffsetLeft: '${stickyHeaderOffsetLeft}`)
      // console.log(`'stickyHeaderOffsetRight: '${stickyHeaderOffsetRight}`)
      // console.log(`'width: '${elWidth}`)
      // console.log(`'widthSticky: '${stickyHeaderwidth}`)
      // console.log(`'coords.width: '${coords.width}`)
      // console.log(`'X: '${elXPosition}`)
      // console.log(`'maxScrollLeft: '${maxScrollLeft}`)

      this.$stickyContainer.css('top', `${this.options.stickyHeaderOffsetY}px`)
      this.$stickyContainer.css('left', `${stickyHeaderOffsetLeft}px`)
      this.$stickyContainer.css('right', `${stickyHeaderOffsetRight}px`)
      this.$stickyContainer.css('width', `${(narrower ? elWidth : stickyHeaderwidth)}`)
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
