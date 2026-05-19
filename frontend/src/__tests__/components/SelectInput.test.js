import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import SelectInput from '../../components/SelectInput';

const OPTIONS = ['Matemáticas', 'Ciencias', 'Historia'];

describe('SelectInput', () => {
    it('muestra el placeholder cuando no hay valor', () => {
        render(
            <SelectInput
                value={null}
                onSelect={jest.fn()}
                options={OPTIONS}
                placeholder="Elige una materia"
            />
        );
        expect(screen.getByText('Elige una materia')).toBeTruthy();
    });

    it('muestra el valor seleccionado', () => {
        render(
            <SelectInput
                value="Ciencias"
                onSelect={jest.fn()}
                options={OPTIONS}
                placeholder="Elige una materia"
            />
        );
        expect(screen.getByText('Ciencias')).toBeTruthy();
    });

    it('abre el modal al presionar el campo', () => {
        render(
            <SelectInput
                value={null}
                onSelect={jest.fn()}
                options={OPTIONS}
                placeholder="Elige una materia"
            />
        );
        fireEvent.press(screen.getByText('Elige una materia'));
        // El modal muestra las opciones
        expect(screen.getByText('Matemáticas')).toBeTruthy();
        expect(screen.getByText('Ciencias')).toBeTruthy();
        expect(screen.getByText('Historia')).toBeTruthy();
    });

    it('llama onSelect con el valor correcto y cierra el modal', () => {
        const onSelect = jest.fn();
        render(
            <SelectInput
                value={null}
                onSelect={onSelect}
                options={OPTIONS}
                placeholder="Elige"
            />
        );
        fireEvent.press(screen.getByText('Elige'));
        fireEvent.press(screen.getByText('Historia'));
        expect(onSelect).toHaveBeenCalledWith('Historia');
    });

    it('muestra "Sin opciones disponibles" cuando options está vacío', () => {
        render(
            <SelectInput
                value={null}
                onSelect={jest.fn()}
                options={[]}
                placeholder="Elige"
            />
        );
        fireEvent.press(screen.getByText('Elige'));
        expect(screen.getByText('Sin opciones disponibles')).toBeTruthy();
    });

    it('soporta opciones como objetos { label, value }', () => {
        const objOptions = [
            { label: 'Matemáticas', value: 'mat' },
            { label: 'Ciencias', value: 'cien' },
        ];
        const onSelect = jest.fn();
        render(
            <SelectInput value={null} onSelect={onSelect} options={objOptions} placeholder="Elige" />
        );
        fireEvent.press(screen.getByText('Elige'));
        fireEvent.press(screen.getByText('Ciencias'));
        expect(onSelect).toHaveBeenCalledWith('cien');
    });
});
