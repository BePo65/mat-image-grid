describe('Test minimal demo application', () => {
  it('contains header', () => {
    cy.visit('/');
    cy.contains('Minimal Demo for Mat-Image-Grid');
  });

  it('contains figures in grid', () => {
    const minimalNumberOfFigures = 12;

    cy.visit('/');

    cy.get('figure')
      .its('length')
      .should('be.greaterThan', minimalNumberOfFigures)
      .then((length) => {
        cy.log('>>> numberOfFigures', length);
      });
  });

  it('contains images in grid', () => {
    let numberOfFigures = 0;
    const minimalNumberOfFigures = 12;

    cy.visit('/');

    cy.get('figure')
      .its('length')
      .should('be.greaterThan', minimalNumberOfFigures)
      .then((length) => {
        numberOfFigures = length;
      });
    cy.get('img')
      .its('length')
      .should((length) => {
        expect(length).to.equal(numberOfFigures * 2);
      });
  });

  it('contains thumbnail images in grid', () => {
    let numberOfFigures = 0;
    const minimalNumberOfFigures = 12;

    cy.visit('/');

    cy.get('figure')
      .its('length')
      .should('be.greaterThan', minimalNumberOfFigures)
      .then((length) => {
        numberOfFigures = length;
      });
    cy.get('.mat-image-grid-thumbnail')
      .its('length')
      .should((length) => {
        expect(length).to.equal(numberOfFigures);
      });
  });

  it('contains full size images in grid', () => {
    let numberOfFigures = 0;
    const minimalNumberOfFigures = 12;

    cy.visit('/');

    cy.get('figure')
      .its('length')
      .should('be.greaterThan', minimalNumberOfFigures)
      .then((length) => {
        numberOfFigures = length;
      });
    cy.get('.mat-image-grid-full-image')
      .its('length')
      .should((length) => {
        expect(length).to.equal(numberOfFigures);
      });
  });
});
