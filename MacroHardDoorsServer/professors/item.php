<?php

/**
 * @package		K2
 * @author		GavickPro http://gavick.com
 */

// no direct access
defined('_JEXEC') or die;

// Code used to generate the page elements
$params = $this->item->params;
$k2ContainerClasses = (($this->item->featured) ? ' itemIsFeatured' : '') . ($params->get('pageclass_sfx')) ? ' '.$params->get('pageclass_sfx') : ''; 

$app        = JFactory::getApplication();
$template   = $app->getTemplate(true);
$gkparams     = $template->params;
$fblang   = $gkparams->get('fb_lang', 'en_US');
?>
<?php if(JRequest::getInt('print')==1): ?>

<a class="itemPrintThisPage" rel="nofollow" href="#" onclick="window.print(); return false;"> <?php echo JText::_('K2_PRINT_THIS_PAGE'); ?> </a>
<?php endif; ?>
<article id="k2Container" class="professorItem itemView<?php echo $k2ContainerClasses; ?>"> <?php echo $this->item->event->BeforeDisplay; ?> <?php echo $this->item->event->K2BeforeDisplay; ?>
          <header class="nodate">
                    <?php if(isset($this->item->editLink)): ?>
                    <a class="itemEditLink modal" rel="{handler:'iframe',size:{x:990,y:550}}" href="<?php echo $this->item->editLink; ?>"><?php echo JText::_('K2_EDIT_ITEM'); ?></a>
                    <?php endif; ?>
                    
                    <?php if($params->get('itemTitle')): ?>
                    <h1><?php echo $this->item->title; ?></h1>
                    <?php endif; ?>
                    <?php if(
					$params->get('itemFontResizer') ||
					$params->get('itemPrintButton') ||
					$params->get('itemEmailButton') ||
					($params->get('itemVideoAnchor') && !empty($this->item->video)) ||
					($params->get('itemImageGalleryAnchor') && !empty($this->item->gallery)) ||
					$params->get('itemHits') ||
					$params->get('itemCategory')
				): ?>
                    <ul>
                              <?php if($params->get('itemCategory')): ?>
                              <li><span><?php echo JText::_('K2_PUBLISHED_IN'); ?></span> <a href="<?php echo $this->item->category->link; ?>"><?php echo $this->item->category->name; ?></a></li>
                              <?php endif; ?>
                              <?php if($params->get('itemHits')): ?>
                              <li><?php echo JText::_('K2_READ'); ?> <?php echo $this->item->hits; ?> <?php echo JText::_('K2_TIMES'); ?> </li>
                              <?php endif; ?>
                              <?php if($params->get('itemFontResizer')): ?>
                              <li class="itemResizer"> <span><?php echo JText::_('K2_FONT_SIZE'); ?></span> <a href="#" id="fontDecrease"><?php echo JText::_('K2_DECREASE_FONT_SIZE'); ?></a> <a href="#" id="fontIncrease"><?php echo JText::_('K2_INCREASE_FONT_SIZE'); ?></a></li>
                              <?php endif; ?>
                              <?php if($params->get('itemPrintButton') && !JRequest::getInt('print')): ?>
                              <li class="itemPrint"><a rel="nofollow" href="<?php echo $this->item->printLink; ?>" onclick="window.open(this.href,'printWindow','width=900,height=600,location=no,menubar=no,resizable=yes,scrollbars=yes'); return false;"><?php echo JText::_('K2_PRINT'); ?></a></li>
                              <?php endif; ?>
                              <?php if($params->get('itemEmailButton') && !JRequest::getInt('print')): ?>
                              <li class="itemEmail"><a rel="nofollow" href="<?php echo $this->item->emailLink; ?>" onclick="window.open(this.href,'emailWindow','width=400,height=350,location=no,menubar=no,resizable=no,scrollbars=no'); return false;"><?php echo JText::_('K2_EMAIL'); ?></a></li>
                              <?php endif; ?>
                              <?php if($params->get('itemVideoAnchor') && !empty($this->item->video)): ?>
                              <li class="itemVideo"> <a class="k2Anchor" href="<?php echo $this->item->link; ?>#itemVideoAnchor"><?php echo JText::_('K2_MEDIA'); ?></a> </li>
                              <?php endif; ?>
                              <?php if($params->get('itemImageGalleryAnchor') && !empty($this->item->gallery)): ?>
                              <li class="itemGallery"> <a class="k2Anchor" href="<?php echo $this->item->link; ?>#itemImageGalleryAnchor"><?php echo JText::_('K2_IMAGE_GALLERY'); ?></a> </li>
                              <?php endif; ?>
                    </ul>
                    <?php endif; ?>
          </header>
          <?php if($params->get('itemImage') && !empty($this->item->image)): ?>
          <div class="itemImageBlock"> 
          	<a class="itemImage modal" rel="{handler: 'image'}" href="<?php echo $this->item->imageXLarge; ?>" title="<?php echo JText::_('K2_CLICK_TO_PREVIEW_IMAGE'); ?>"> <img src="<?php echo $this->item->image; ?>" alt="<?php if(!empty($this->item->image_caption)) echo K2HelperUtilities::cleanHtml($this->item->image_caption); else echo K2HelperUtilities::cleanHtml($this->item->title); ?>" style="width:<?php echo $this->item->imageWidth; ?>px; height:auto;" /> </a>
          </div>
          <?php endif; ?>
          
          <?php if($params->get('itemExtraFields') && count($this->item->extra_fields)): ?>
          <div class="itemExtraFields">
            <ul>
                      <?php foreach ($this->item->extra_fields as $key=>$extraField): ?>
                      <?php if($extraField->value != ''): ?>
                      <li class="<?php echo ($key%2) ? "odd" : "even"; ?> type<?php echo ucfirst($extraField->type); ?> group<?php echo $extraField->group; ?>">
                                <?php if($extraField->type == 'header'): ?>
                                <h4 class="itemExtraFieldsHeader"><?php echo $extraField->name; ?></h4>
                                <?php else: ?>
                                <span class="itemExtraFieldsLabel"><?php echo $extraField->name; ?>:</span> <span class="itemExtraFieldsValue"><?php echo $extraField->value; ?></span>
                                <?php endif; ?>
                      </li>
                      <?php endif; ?>
                      <?php endforeach; ?>
            </ul>
          </div>
          <?php endif; ?>
          
          
          <?php echo $this->item->event->AfterDisplayTitle; ?> 
          <?php echo $this->item->event->K2AfterDisplayTitle; ?>
          <div class="itemBody"> 
          	<?php echo $this->item->event->BeforeDisplayContent; ?> 
          	<?php echo $this->item->event->K2BeforeDisplayContent; ?>
                    <?php if(!empty($this->item->fulltext)): ?>
                    <?php if($params->get('itemIntroText')): ?>
                    <div class="itemIntroText"> <?php echo $this->item->introtext; ?> </div>
                    <?php endif; ?>
                    <?php endif; ?>
                    <?php if($params->get('itemFullText')): ?>
                    <div class="itemFullText"> <?php echo (!empty($this->item->fulltext)) ? $this->item->fulltext : $this->item->introtext; ?> </div>
                    <?php endif; ?>
                    <?php if(($params->get('itemDateModified') && intval($this->item->modified)!=0)): ?>
                    <div class="itemBottom">
                              <?php if($params->get('itemDateModified') && intval($this->item->modified) != 0 && $this->item->created != $this->item->modified): ?>
                              <small class="itemDateModified"> <?php echo JText::_('K2_LAST_MODIFIED_ON') . JHTML::_('date', $this->item->modified, JText::_('K2_DATE_FORMAT_LC2')); ?> </small>
                              <?php endif; ?>
                    </div>
                    <?php endif; ?>
                   
                    <?php echo $this->item->event->AfterDisplayContent; ?> <?php echo $this->item->event->K2AfterDisplayContent; ?>
                    <?php if(
						$params->get('itemAttachments') ||
						$params->get('itemRating')
					): ?>
                    <div class="itemLinks">
                              <?php if($params->get('itemAttachments') && count($this->item->attachments)): ?>
                              <div class="itemAttachmentsBlock"> <span><?php echo JText::_('K2_DOWNLOAD_ATTACHMENTS'); ?></span>
                                        <ul class="itemAttachments">
                                                  <?php foreach ($this->item->attachments as $attachment): ?>
                                                  <li> <a title="<?php echo K2HelperUtilities::cleanHtml($attachment->titleAttribute); ?>" href="<?php echo $attachment->link; ?>"><?php echo $attachment->title; ?>
                                                            <?php if($params->get('itemAttachmentsCounter')): ?>
                                                            <span>(<?php echo $attachment->hits; ?> <?php echo ($attachment->hits==1) ? JText::_('K2_DOWNLOAD') : JText::_('K2_DOWNLOADS'); ?>)</span>
                                                            <?php endif; ?>
                                                            </a> </li>
                                                  <?php endforeach; ?>
                                        </ul>
                              </div>
                              <?php endif; ?>
                              
                              <?php if($params->get('itemRating')): ?>
                              <div class="itemRatingBlock"> <span><?php echo JText::_('K2_RATE_THIS_ITEM'); ?></span>
                                        <div class="itemRatingForm">
                                                  <ul class="itemRatingList">
                                                            <li class="itemCurrentRating" id="itemCurrentRating<?php echo $this->item->id; ?>" style="width:<?php echo $this->item->votingPercentage; ?>%;"></li>
                                                            <li> <a href="#" rel="<?php echo $this->item->id; ?>" title="<?php echo JText::_('K2_1_STAR_OUT_OF_5'); ?>" class="one-star">1</a> </li>
                                                            <li> <a href="#" rel="<?php echo $this->item->id; ?>" title="<?php echo JText::_('K2_2_STARS_OUT_OF_5'); ?>" class="two-stars">2</a> </li>
                                                            <li> <a href="#" rel="<?php echo $this->item->id; ?>" title="<?php echo JText::_('K2_3_STARS_OUT_OF_5'); ?>" class="three-stars">3</a> </li>
                                                            <li> <a href="#" rel="<?php echo $this->item->id; ?>" title="<?php echo JText::_('K2_4_STARS_OUT_OF_5'); ?>" class="four-stars">4</a> </li>
                                                            <li> <a href="#" rel="<?php echo $this->item->id; ?>" title="<?php echo JText::_('K2_5_STARS_OUT_OF_5'); ?>" class="five-stars">5</a> </li>
                                                  </ul>
                                                  <div id="itemRatingLog<?php echo $this->item->id; ?>" class="itemRatingLog"> <?php echo $this->item->numOfvotes; ?> </div>
                                        </div>
                              </div>
                              <?php endif; ?>
                    </div>
                    <?php endif; ?>
  
                    <?php if($params->get('itemVideo') && !empty($this->item->video)): ?>
                    <div class="itemVideoBlock" id="itemVideoAnchor">
                              <h3><?php echo JText::_('K2_MEDIA'); ?></h3>
                              <?php if($this->item->videoType=='embedded'): ?>
                              <div class="itemVideoEmbedded"> <?php echo $this->item->video; ?> </div>
                              <?php else: ?>
                              <span class="itemVideo"><?php echo $this->item->video; ?></span>
                              <?php endif; ?>
                              <?php if($params->get('itemVideoCaption') && !empty($this->item->video_caption)): ?>
                              <span class="itemVideoCaption"><?php echo $this->item->video_caption; ?></span>
                              <?php endif; ?>
                              <?php if($params->get('itemVideoCredits') && !empty($this->item->video_credits)): ?>
                              <span class="itemVideoCredits"><?php echo $this->item->video_credits; ?></span>
                              <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    <?php if($params->get('itemImageGallery') && !empty($this->item->gallery)): ?>
                    <div class="itemImageGallery" id="itemImageGalleryAnchor">
                              <h3><?php echo JText::_('K2_IMAGE_GALLERY'); ?></h3>
                              <?php echo $this->item->gallery; ?> </div>
                    <?php endif; ?>
                    <?php if($params->get('itemNavigation') && !JRequest::getCmd('print') && (isset($this->item->nextLink) || isset($this->item->previousLink))): ?>
                    <div class="itemNavigation"> <span><?php echo JText::_('K2_MORE_IN_THIS_CATEGORY'); ?></span>
                              <?php if(isset($this->item->previousLink)): ?>
                              <a class="itemPrevious" href="<?php echo $this->item->previousLink; ?>">&laquo; <?php echo $this->item->previousTitle; ?></a>
                              <?php endif; ?>
                              <?php if(isset($this->item->nextLink)): ?>
                              <a class="itemNext" href="<?php echo $this->item->nextLink; ?>"><?php echo $this->item->nextTitle; ?> &raquo;</a>
                              <?php endif; ?>
                    </div>
                    <?php endif; ?>
                    <?php echo $this->item->event->AfterDisplay; ?> 
                    <?php echo $this->item->event->K2AfterDisplay; ?> 
          </div>
          <?php if($params->get('itemTwitterButton',1) || $params->get('itemFacebookButton',1) || $params->get('itemGooglePlusOneButton',1)): ?>
          <div class="itemSocialSharing">
                    <?php if($params->get('itemTwitterButton',1)): ?>
                    <div class="itemTwitterButton"> <a href="https://twitter.com/share" class="twitter-share-button" data-count="horizontal"<?php if($params->get('twitterUsername')): ?> data-via="<?php echo $params->get('twitterUsername'); ?>"<?php endif; ?>><?php echo JText::_('K2_TWEET'); ?></a> 
                              <script type="text/javascript" src="//platform.twitter.com/widgets.js"></script> 
                    </div>
                    <?php endif; ?>
                    <?php if($params->get('itemFacebookButton',1)): ?>
                    <div class="itemFacebookButton"> 
                              <script type="text/javascript">                                                         
                          window.addEvent('load', function(){
                    			(function(){
                                	if(document.id('fb-auth') == null) {
                                		var root = document.createElement('div');
                                		root.id = 'fb-root';
                                		$$('.itemFacebookButton')[0].appendChild(root);
                                			(function(d, s, id) {
                                  			var js, fjs = d.getElementsByTagName(s)[0];
                                  			if (d.getElementById(id)) {return;}
                                  			js = d.createElement(s); js.id = id;
                                  			js.src = document.location.protocol + "//connect.facebook.net/<?php echo $fblang; ?>/all.js#xfbml=1";
                                  			fjs.parentNode.insertBefore(js, fjs);
                                			}(document, 'script', 'facebook-jssdk')); 
                            			}
                          		}());
                      		});
                    		</script>
                              <div class="fb-like" data-width="150" data-layout="standard" data-action="like" data-show-faces="false" data-share="true"></div>
                    </div>
                    <?php endif; ?>
                    <?php if($params->get('itemGooglePlusOneButton',1)): ?>
                    <div class="itemGooglePlusOneButton">
                              <div class="g-plusone" data-size="standard"></div>
                              <script type="text/javascript">                              
                            window.___gcfg = {lang: 'pl'};
                          
                            (function() {
                              var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                              po.src = 'https://apis.google.com/js/platform.js';
                              var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
                            })();
                        </script> 
                    </div>
                    <?php endif; ?>
          </div>
          <?php endif; ?>
</article>
