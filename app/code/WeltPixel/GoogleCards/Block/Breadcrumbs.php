<?php

namespace WeltPixel\GoogleCards\Block;

/**
 * Class Breadcrumbs
 * @package WeltPixel\GoogleCards\Block
 */
class Breadcrumbs extends \Magento\Framework\View\Element\Template
{
    /**
     * @var \WeltPixel\GoogleCards\Model\BreadcrumbStorage
     */
    protected $_breadcrumbStorage;

    /**
     * @var \Magento\Catalog\Helper\Data
     */
    protected $_catalogHelper;

    /**
     * Breadcrumbs constructor.
     * @param \Magento\Backend\Block\Template\Context $context
     * @param \WeltPixel\GoogleCards\Model\BreadcrumbStorage $breadcrumbStorage
     * @param \Magento\Catalog\Helper\Data $catalogHelper
     * @param array $data
     */
    public function __construct(
        \Magento\Backend\Block\Template\Context $context,
        \WeltPixel\GoogleCards\Model\BreadcrumbStorage $breadcrumbStorage,
        \Magento\Catalog\Helper\Data $catalogHelper,
        array $data = []
    )
    {
        $this->_breadcrumbStorage = $breadcrumbStorage;
        $this->_catalogHelper = $catalogHelper;
        parent::__construct($context, $data);
    }

    /**
     * Retrieve Breadcrumb data from session
     * @return mixed
     */
    public function getCrumbs()
    {
        $crumbs = $this->_breadcrumbStorage->getBreadcrumbData() ? $this->_breadcrumbStorage->getBreadcrumbData() : [];

        $crumbsWithLinks  = [];
        foreach ($crumbs as $crumb) {
            if (isset($crumb['link']) && strlen($crumb['link'])) {
                $crumbsWithLinks[] = $crumb;
            }
        }

        return $crumbsWithLinks;
    }

    /**
     * @return \Magento\Framework\View\Element\Template|void
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    protected function _prepareLayout()
    {
        parent::_prepareLayout();

        if ($this->_catalogHelper->getProduct()) {
            $this->getLayout()->createBlock(\Magento\Catalog\Block\Breadcrumbs::class);
        }
    }
}
