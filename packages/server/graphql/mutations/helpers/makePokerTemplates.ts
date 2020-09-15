import TemplateScaleValue from '../../../database/types/TemplateScaleValue'
import PokerTemplate from '../../../database/types/PokerTemplate'
import TemplateDimension from '../../../database/types/TemplateDimension'
import TemplateScale from '../../../database/types/TemplateScale'

interface TemplateObject {
  [templateName: string]: string[]
}

const makePokerTemplates = (teamId: string, orgId: string, templateObj: TemplateObject) => {
  const pokerScales: TemplateScale[] = []
  const pokerDimensions: TemplateDimension[] = []
  const templates: PokerTemplate[] = []
  const templateNames = Object.keys(templateObj)
  templateNames.forEach((templateName) => {
    const dimensionBase = templateObj[templateName]
    const template = new PokerTemplate({name: templateName, teamId, orgId})

    const dimensions = dimensionBase.map((dimensionName) => {
      const newScaleValues = [
        new TemplateScaleValue({color: '#5CA0E5', label: 'XS', value: 1}),
        new TemplateScaleValue({color: '#5CA0E5', label: 'SM', value: 2}),
        new TemplateScaleValue({color: '#45E595', label: 'M', value: 3}),
        new TemplateScaleValue({color: '#E59545', label: 'L', value: 4}),
        new TemplateScaleValue({color: '#E59545', label: 'XL', value: 5})
      ]
      const newScale = new TemplateScale({
        name: 'T-Shirt Sizes',
        values: newScaleValues,
        teamId: teamId,
        templateId: template.id
      })
      pokerScales.push(newScale)

      const newDimension = new TemplateDimension({
        name: dimensionName,
        teamId,
        templateId: template.id,
        scaleId: newScale.id
      })

      return newDimension
    })
    templates.push(template)
    pokerDimensions.push(...dimensions)
  })
  return {pokerDimensions, pokerScales, templates}
}

export default makePokerTemplates
