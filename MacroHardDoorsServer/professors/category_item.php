<?php

/**
 * @package		K2
 * @author		GavickPro http://gavick.com
 */

// no direct access
defined('_JEXEC') or die;

// Define default image size (do not change)
K2HelperUtilities::setDefaultImage($this->item, 'itemlist', $this->params);

?>

<article class="professorView"> 
	<?php echo $this->item->event->BeforeDisplay; ?> 
	<?php echo $this->item->event->K2BeforeDisplay; ?>		
		<?php if($this->item->params->get('catItemImage') && !empty($this->item->image)): ?>
		<a class="itemImageBlock" href="<?php echo $this->item->link; ?>" title="<?php if(!empty($this->item->image_caption)) echo K2HelperUtilities::cleanHtml($this->item->image_caption); else echo K2HelperUtilities::cleanHtml($this->item->title); ?>"><div style=" width: 100%;padding-bottom: 100%;position: relative;">
          
          <img src="<?php echo $this->item->image; ?>" alt="<?php if(!empty($this->item->image_caption)) echo K2HelperUtilities::cleanHtml($this->item->image_caption); else echo K2HelperUtilities::cleanHtml($this->item->title); ?>" style="object-fit:cover;  position: absolute; top: 0; bottom: 0; left: 0; right: 0;" /> </div> </a>
		<?php endif; ?>
		
		<?php if(isset($this->item->editLink)): ?>
		<a class="catItemEditLink modal" rel="{handler:'iframe',size:{x:990,y:550}}" href="<?php echo $this->item->editLink; ?>">
			<?php echo JText::_('K2_EDIT_ITEM'); ?>
		</a>
		<?php endif; ?>

		<?php if($this->item->params->get('catItemTitle')): ?>
		<header class="nodate">
			<h2>
					<?php if ($this->item->params->get('catItemTitleLinked')): ?>
					<a href="<?php echo $this->item->link; ?>"><?php echo $this->item->title; ?></a>
					<?php else: ?>
					<?php echo $this->item->title; ?>
					<?php endif; ?>
			</h2>
		</header>
		<?php endif; ?>
		
		<?php echo $this->item->event->AfterDisplayTitle; ?> 
		<?php echo $this->item->event->K2AfterDisplayTitle; ?>
		
		<?php echo $this->item->event->AfterDisplay; ?> 
		<?php echo $this->item->event->K2AfterDisplay; ?>
</article>
